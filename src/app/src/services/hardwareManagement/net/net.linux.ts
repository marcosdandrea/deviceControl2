import { NetworkConfiguration, NetworkStatus } from "@common/types/network";
import { NetworkManager } from "./index.js";
import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";

const execAsync = promisify(exec);

/**
 * Implementación de NetworkManager para Linux (optimizado para Raspberry Pi con Debian Bookworm)
 * Monitorea ÚNICAMENTE conexiones Ethernet (no WiFi)
 *
 * Estrategia:
 * - On-demand: ip/nmcli commands para obtener configuración actual
 * - On-event: Monitorea eventos de udev/netlink para detectar cambios en interfaces ethernet
 *   Alternativa: inotify en /sys/class/net/<interface>/operstate
 *
 * Eventos emitidos:
 * - NETWORK_INTERFACES_UPDATED
 * - NETWORK_DISCONNECTED
 * - NETWORK_CONNECTING  
 * - NETWORK_CONNECTED
 */
export class NetworkManagerLinux extends NetworkManager {

  private monitorProcess: ChildProcess | null = null;
  private ethernetInterface: string | null = null;

  constructor(networkConfig?: NetworkConfiguration) {
    super(networkConfig);
  }

  /**
   * Detecta la primera interfaz Ethernet disponible (excluye WiFi, loopback, virtuales)
   * Prioridad: eth0, enp*, eno*, ens*
   */
  private async detectEthernetInterface(): Promise<string | null> {
    try {
      const netDir = "/sys/class/net";
      const interfaces = await fs.readdir(netDir);
      
      // Filtrar interfaces válidas (excluir loopback, wireless, virtuales)
      const ethernetInterfaces: string[] = [];
      
      for (const iface of interfaces) {
        // Saltar loopback
        if (iface === "lo") continue;
        
        // Verificar si es wireless
        const wirelessPath = path.join(netDir, iface, "wireless");
        const isWireless = await fs.access(wirelessPath).then(() => true).catch(() => false);
        if (isWireless) continue;
        
        // Verificar si es virtual (bridge, tun, tap, veth, docker, virbr)
        if (/^(br|tun|tap|veth|docker|virbr|vbox)/.test(iface)) continue;
        
        // Priorizar interfaces comunes de Ethernet
        if (/^(eth|enp|eno|ens)/.test(iface)) {
          ethernetInterfaces.push(iface);
        }
      }
      
      // Ordenar con prioridad: eth0, eth*, enp*, eno*, ens*
      ethernetInterfaces.sort((a, b) => {
        if (a === "eth0") return -1;
        if (b === "eth0") return 1;
        if (a.startsWith("eth")) return -1;
        if (b.startsWith("eth")) return 1;
        return a.localeCompare(b);
      });
      
      const selectedInterface = ethernetInterfaces[0] || null;
      if (selectedInterface) {
        this.log.info(`Detected Ethernet interface: ${selectedInterface}`);
      } else {
        this.log.warn("No Ethernet interface detected");
      }
      
      return selectedInterface;
    } catch (error) {
      this.log.error("Failed to detect Ethernet interface:", error);
      return null;
    }
  }

  /**
   * Monitorea cambios en la interfaz Ethernet usando inotify en /sys/class/net/<interface>/operstate
   * Este enfoque es más eficiente que polling y reacciona inmediatamente a cambios del kernel
   */
  protected async watchForNetworkChanges(): Promise<void> {
    try {
      this.ethernetInterface = await this.detectEthernetInterface();
      
      if (!this.ethernetInterface) {
        this.log.warn("No Ethernet interface to monitor");
        return;
      }

      const operstatePath = `/sys/class/net/${this.ethernetInterface}/operstate`;
      
      // Verificar que el archivo existe
      await fs.access(operstatePath);
      
      // Verificar si inotify-tools está instalado antes de intentar usarlo
      const hasInotifyTools = await this.checkInotifyToolsAvailable();
      
      if (!hasInotifyTools) {
        this.log.warn("inotify-tools not available, using fs.watch as fallback method");
        this.watchWithFsWatch(operstatePath);
        return;
      }
      
      this.log.info(`Starting network monitor on ${this.ethernetInterface} using inotify`);
      
      // Usar inotifywait para monitorear cambios (requiere inotify-tools)
      this.monitorProcess = spawn("inotifywait", [
        "-m",  // monitor mode (continuo)
        "-e", "modify",  // eventos de modificación
        "-e", "attrib",  // eventos de cambio de atributos
        operstatePath
      ]);
      
      this.monitorProcess.stdout?.on("data", (data) => {
        const output = data.toString().trim();
        if (output) {
          this.log.info("Network change detected on interface:", this.ethernetInterface);
          // Delay breve para evitar múltiples ejecuciones simultáneas
          setTimeout(() => this.fetchNetworkStatus(), 500);
        }
      });
      
      this.monitorProcess.stderr?.on("data", (data) => {
        const error = data.toString().trim();
        if (error && !error.includes("Watches established")) {
          this.log.warn("inotifywait stderr:", error);
        }
      });
      
      this.monitorProcess.on("error", (error) => {
        this.log.warn("inotifywait failed to start, using fs.watch fallback. To use inotifywait, install with: sudo apt-get install inotify-tools");
        this.log.debug("inotifywait error details:", error);
        this.watchWithFsWatch(operstatePath);
      });
      
      this.monitorProcess.on("exit", (code) => {
        if (code !== 0 && code !== null) {
          this.log.warn(`inotifywait exited with code ${code}, falling back to fs.watch`);
          this.watchWithFsWatch(operstatePath);
        }
      });
      
      this.log.info(`Network monitor started with inotifywait on PID: ${this.monitorProcess.pid}`);
      
    } catch (error) {
      this.log.error("Failed to start network monitor:", error);
      // Intentar con fs.watch como fallback
      if (this.ethernetInterface) {
        const operstatePath = `/sys/class/net/${this.ethernetInterface}/operstate`;
        this.watchWithFsWatch(operstatePath);
      }
    }
  }

  /**
   * Verifica si inotify-tools está disponible en el sistema
   */
  private async checkInotifyToolsAvailable(): Promise<boolean> {
    try {
      await execAsync("which inotifywait");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fallback: Monitoreo usando fs.watch de Node.js (sin dependencias externas)
   */
  private watchWithFsWatch(operstatePath: string): void {
    try {
      // Verificar que el archivo existe antes de intentar monitorearlo
      if (!fsSync.existsSync(operstatePath)) {
        this.log.error(`Cannot monitor ${operstatePath}: file does not exist`);
        return;
      }
      
      const watcher = fsSync.watch(operstatePath);
      
      let debounceTimer: NodeJS.Timeout | null = null;
      
      watcher.on("change", (eventType) => {
        // Debounce: evitar múltiples llamadas rápidas
        if (debounceTimer) clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
          this.log.info(`Network change detected (fs.watch, event: ${eventType})`);
          this.fetchNetworkStatus();
        }, 500);
      });
      
      watcher.on("error", (error) => {
        this.log.error("fs.watch error:", error);
        // Intentar reiniciar el monitor después de un error
        setTimeout(() => {
          this.log.info("Attempting to restart fs.watch monitor");
          this.watchWithFsWatch(operstatePath);
        }, 5000);
      });
      
      this.log.info(`Network monitor started using fs.watch (fallback mode) on ${operstatePath}`);
    } catch (error) {
      this.log.error("Failed to start fs.watch:", error);
    }
  }

  /**
   * Obtiene el estado actual de la interfaz Ethernet usando comandos del sistema
   * Prioridad: nmcli (NetworkManager) > ip/ifconfig
   */
  protected async fetchNetworkStatus(): Promise<void> {
    try {
      if (!this.ethernetInterface) {
        this.ethernetInterface = await this.detectEthernetInterface();
        if (!this.ethernetInterface) {
          this.log.warn("No Ethernet interface available");
          return;
        }
      }

      const iface = this.ethernetInterface;
      this.log.debug(`Fetching network status for interface: ${iface}`);
      
      // Leer estado operacional desde sysfs
      const operstatePath = `/sys/class/net/${iface}/operstate`;
      const operstate = (await fs.readFile(operstatePath, "utf-8")).trim();
      this.log.debug(`Interface ${iface} operstate: ${operstate}`);
      
      const isUp = operstate === "up";
      
      // Obtener configuración IP usando 'ip' command
      const ipCommand = `ip -j addr show ${iface}`;
      this.log.debug(`Executing: ${ipCommand}`);
      const { stdout: ipOutput } = await execAsync(ipCommand);
      this.log.debug(`IP command output: ${ipOutput}`);
      
      const ipData = JSON.parse(ipOutput);
      
      let ipv4Address = "";
      let subnetMask = "";
      let dhcpEnabled = true; // Por defecto asumimos DHCP
      
      if (ipData && ipData.length > 0 && ipData[0]) {
        const addr_info = ipData[0].addr_info || [];
        this.log.debug(`Address info count: ${addr_info.length}`);
        
        // Buscar la primera dirección IPv4 que no sea loopback
        const ipv4 = addr_info.find((a: any) => 
          a.family === "inet" && 
          a.local && 
          !a.local.startsWith("127.")
        );
        
        this.log.debug(`IPv4 entry found:`, ipv4);
        
        if (ipv4) {
          ipv4Address = ipv4.local;
          // Convertir prefixlen a subnet mask
          subnetMask = this.prefixLenToSubnetMask(ipv4.prefixlen);
          this.log.debug(`Parsed IPv4: ${ipv4Address}, Subnet: ${subnetMask}, PrefixLen: ${ipv4.prefixlen}`);
        } else {
          this.log.debug("No valid IPv4 address found in addr_info");
        }
      } else {
        this.log.debug("No IP data received or empty array");
      }
      
      // Obtener gateway
      let gateway = "";
      try {
        const routeCommand = `ip -j route show default dev ${iface}`;
        this.log.debug(`Executing: ${routeCommand}`);
        const { stdout: routeOutput } = await execAsync(routeCommand);
        this.log.debug(`Route command output: ${routeOutput}`);
        
        const routes = JSON.parse(routeOutput);
        if (routes && routes[0]) {
          gateway = routes[0].gateway || "";
          this.log.debug(`Gateway found: ${gateway}`);
        }
      } catch (error) {
        this.log.debug("No default gateway found for interface");
      }
      
      // Obtener DNS servers
      let dnsServers: string[] = [];
      try {
        // Intentar leer de resolv.conf o systemd-resolve
        const resolvCommand = "cat /etc/resolv.conf | grep nameserver | awk '{print $2}'";
        const { stdout: resolvOutput } = await execAsync(resolvCommand);
        dnsServers = resolvOutput.trim().split("\n").filter(ip => ip && ip !== "127.0.0.53");
        
        // Si encuentra 127.0.0.53 (systemd-resolved), usar systemd-resolve
        if (dnsServers.length === 0 || resolvOutput.includes("127.0.0.53")) {
          try {
            // Intentar primero con resolvectl (Debian 13+)
            const { stdout: systemdResolve } = await execAsync(`resolvectl status ${iface} 2>/dev/null | grep "DNS Servers" | awk '{print $3}'`);
            const systemdDns = systemdResolve.trim().split("\n").filter(ip => ip);
            if (systemdDns.length > 0) {
              dnsServers = systemdDns;
            }
          } catch {
            // Fallback para Debian 12: usar systemd-resolve
            try {
              const { stdout: systemdResolve } = await execAsync(`systemd-resolve --status ${iface} 2>/dev/null | grep "DNS Servers" | awk '{print $3}'`);
              const systemdDns = systemdResolve.trim().split("\n").filter(ip => ip);
              if (systemdDns.length > 0) {
                dnsServers = systemdDns;
              }
            } catch {
              // Ningún comando systemd disponible
            }
          }
        }
        this.log.debug(`DNS servers found: ${dnsServers.join(", ")}`);
      } catch (error) {
        this.log.warn("Could not read DNS servers:", error);
      }
      
      // Detectar si es DHCP usando múltiples métodos
      let dhcpDetected = false;
      
      // Método 1: Verificar si la IP tiene flag "dynamic" en el JSON
      if (ipData && ipData.length > 0 && ipData[0] && ipData[0].addr_info) {
        const ipv4Info = ipData[0].addr_info.find((a: any) => a.family === "inet" && a.local && !a.local.startsWith("127."));
        if (ipv4Info && ipv4Info.dynamic === true) {
          dhcpDetected = true;
          this.log.debug("DHCP detected via 'dynamic' flag in IP data");
        }
      }
      
      // Método 2: Buscar procesos DHCP si el método anterior no funcionó
      if (!dhcpDetected) {
        try {
          await execAsync(`pgrep -f "dhclient|dhcpcd" | head -1`);
          dhcpDetected = true;
          this.log.debug("DHCP client process detected");
        } catch {
          // Método 3: Verificar archivos de configuración típicos de DHCP
          try {
            await execAsync(`ls /var/lib/dhcp/dhclient.*.leases 2>/dev/null | head -1`);
            dhcpDetected = true;
            this.log.debug("DHCP lease files found");
          } catch {
            this.log.debug("No DHCP indicators found, assuming static IP");
          }
        }
      }
      
      dhcpEnabled = dhcpDetected;
      
      // Mejorar la lógica de detección de estado
      // Una interfaz está conectada si:
      // 1. El operstate es "up" Y
      // 2. Tiene una dirección IP válida (no 0.0.0.0) Y
      // 3. La dirección IP no es de loopback
      const hasValidIP = ipv4Address && ipv4Address !== "0.0.0.0" && !ipv4Address.startsWith("127.");
      const status = isUp && hasValidIP ? NetworkStatus.CONNECTED : NetworkStatus.DISCONNECTED;
      
      this.log.debug(`Status determination: isUp=${isUp}, hasValidIP=${hasValidIP}, finalStatus=${status}`);
      
      this.updateNetworkConfig({
        interfaceName: iface,
        status,
        dhcpEnabled,
        ipv4Address: ipv4Address || "0.0.0.0",
        subnetMask: subnetMask || "0.0.0.0",
        gateway: gateway || "0.0.0.0",
        dnsServers: dnsServers.length > 0 ? dnsServers : ["0.0.0.0"]
      });
      
    } catch (error) {
      this.log.error("Failed to fetch network status:", error);
    }
  }

  /**
   * Convierte prefix length (CIDR) a subnet mask
   */
  private prefixLenToSubnetMask(prefixLen: number): string {
    const mask = ~(2 ** (32 - prefixLen) - 1);
    return [
      (mask >>> 24) & 0xff,
      (mask >>> 16) & 0xff,
      (mask >>> 8) & 0xff,
      mask & 0xff
    ].join(".");
  }

  /**
   * Establece la configuración de red en Linux
   * Usa NetworkManager (nmcli) si está disponible, sino usa ip/ifconfig
   */
  async setNetworkConfiguration(config: NetworkConfiguration): Promise<void> {
    try {
      if (!this.ethernetInterface) {
        throw new Error("No Ethernet interface available");
      }

      const iface = this.ethernetInterface;
      
      // Verificar si NetworkManager está disponible
      const hasNetworkManager = await execAsync("which nmcli").then(() => true).catch(() => false);
      
      if (hasNetworkManager) {
        await this.setNetworkConfigWithNetworkManager(iface, config);
      } else {
        await this.setNetworkConfigWithIpCommands(iface, config);
      }
      
      // Actualizar estado después de configurar
      setTimeout(() => this.fetchNetworkStatus(), 2000);
      
      this.log.info("Network configuration applied successfully");
    } catch (error) {
      this.log.error("Failed to set network configuration:", error);
      throw error;
    }
  }

  /**
   * Configura red usando NetworkManager (nmcli)
   */
  private async setNetworkConfigWithNetworkManager(iface: string, config: NetworkConfiguration): Promise<void> {
    // Buscar conexión existente
    let connectionName = iface;
    
    try {
      const { stdout } = await execAsync(`nmcli -t -f NAME,DEVICE connection show | grep ":${iface}$"`);
      const match = stdout.trim().split(":")[0];
      if (match) connectionName = match;
    } catch {
      // No hay conexión existente, crear una nueva
      this.log.info(`Creating new NetworkManager connection for ${iface}`);
    }
    
    if (config.dhcpEnabled) {
      // Configurar DHCP
      await execAsync(`nmcli connection modify "${connectionName}" ipv4.method auto`);
      await execAsync(`nmcli connection modify "${connectionName}" ipv4.dns ""`);
      await execAsync(`nmcli connection modify "${connectionName}" ipv4.gateway ""`);
    } else {
      // Configurar IP estática
      const { ipv4Address, subnetMask, gateway, dnsServers } = config;
      
      // Calcular CIDR desde subnet mask
      const cidr = this.subnetMaskToPrefixLen(subnetMask);
      const ipWithCidr = `${ipv4Address}/${cidr}`;
      
      await execAsync(`nmcli connection modify "${connectionName}" ipv4.method manual`);
      await execAsync(`nmcli connection modify "${connectionName}" ipv4.addresses "${ipWithCidr}"`);
      await execAsync(`nmcli connection modify "${connectionName}" ipv4.gateway "${gateway}"`);
      
      if (dnsServers && dnsServers.length > 0) {
        const dnsString = dnsServers.join(" ");
        await execAsync(`nmcli connection modify "${connectionName}" ipv4.dns "${dnsString}"`);
      }
    }
    
    // Aplicar cambios
    await execAsync(`nmcli connection up "${connectionName}"`);
  }

  /**
   * Configura red usando comandos ip/ifconfig (sin NetworkManager)
   */
  private async setNetworkConfigWithIpCommands(iface: string, config: NetworkConfiguration): Promise<void> {
    const { ipv4Address, subnetMask, gateway, dnsServers, dhcpEnabled } = config;
    
    if (dhcpEnabled) {
      // Iniciar DHCP client
      await execAsync(`dhclient -r ${iface}`); // Release actual
      await execAsync(`dhclient ${iface}`);    // Renovar
    } else {
      // Configurar IP estática
      const cidr = this.subnetMaskToPrefixLen(subnetMask);
      
      // Flush configuración actual
      await execAsync(`ip addr flush dev ${iface}`);
      
      // Asignar IP
      await execAsync(`ip addr add ${ipv4Address}/${cidr} dev ${iface}`);
      
      // Levantar interfaz
      await execAsync(`ip link set ${iface} up`);
      
      // Configurar gateway
      if (gateway && gateway !== "0.0.0.0") {
        await execAsync(`ip route add default via ${gateway} dev ${iface}`).catch(() => {
          // Gateway ya existe, reemplazar
          execAsync(`ip route replace default via ${gateway} dev ${iface}`);
        });
      }
      
      // Configurar DNS (escribir en resolv.conf - método básico)
      if (dnsServers && dnsServers.length > 0) {
        const dnsLines = dnsServers.map(dns => `nameserver ${dns}`).join("\n");
        // Backup resolv.conf
        await execAsync("cp /etc/resolv.conf /etc/resolv.conf.backup").catch(() => {});
        // Escribir nuevos DNS
        await fs.writeFile("/etc/resolv.conf", `# Generated by DeviceControl\n${dnsLines}\n`);
      }
    }
  }

  /**
   * Convierte subnet mask a prefix length (CIDR)
   */
  private subnetMaskToPrefixLen(subnetMask: string): number {
    const parts = subnetMask.split(".").map(Number);
    const binary = parts.map(p => p.toString(2).padStart(8, "0")).join("");
    return binary.split("1").length - 1;
  }

  /**
   * Limpia recursos
   */
  destroy() {
    if (this.monitorProcess) {
      this.monitorProcess.kill();
      this.monitorProcess = null;
    }
    super.destroy();
  }
}
