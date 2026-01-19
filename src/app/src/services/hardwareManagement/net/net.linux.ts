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
      const carrierPath = `/sys/class/net/${this.ethernetInterface}/carrier`;
      
      // Verificar que los archivos existen
      await fs.access(operstatePath);
      
      // Verificar si inotify-tools está instalado antes de intentar usarlo
      const hasInotifyTools = await this.checkInotifyToolsAvailable();
      
      if (!hasInotifyTools) {
        this.log.warn("inotify-tools not available, using fs.watch as fallback method");
        this.watchWithFsWatch(operstatePath, carrierPath);
        return;
      }
      
      this.log.info(`Starting network monitor on ${this.ethernetInterface} using inotify`);
      
      // Usar inotifywait para monitorear cambios en ambos archivos (requiere inotify-tools)
      this.monitorProcess = spawn("inotifywait", [
        "-m",  // monitor mode (continuo)
        "-e", "modify",  // eventos de modificación
        "-e", "attrib",  // eventos de cambio de atributos
        operstatePath,
        carrierPath
      ]);
      
      this.monitorProcess.stdout?.on("data", (data) => {
        const output = data.toString().trim();
        if (output) {
          this.log.info("Network change detected on interface:", this.ethernetInterface, "Event:", output);
          
          // Determinar si es probablemente una reconexión basándose en el archivo que cambió
          const isCarrierEvent = output.includes("carrier");
          const isReconnectionCandidate = isCarrierEvent && this.networkConfig?.status === 'disconnected';
          
          if (isReconnectionCandidate) {
            // Para reconexiones potenciales, verificar más rápido
            this.log.info("Possible reconnection detected, checking network status immediately");
            setTimeout(() => this.fetchNetworkStatus(), 100);
          } else {
            // Para otros eventos, usar el delay normal
            setTimeout(() => this.fetchNetworkStatus(), 500);
          }
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
        this.watchWithFsWatch(operstatePath, carrierPath);
      });
      
      this.monitorProcess.on("exit", (code) => {
        if (code !== 0 && code !== null) {
          this.log.warn(`inotifywait exited with code ${code}, falling back to fs.watch`);
          this.watchWithFsWatch(operstatePath, carrierPath);
        }
      });
      
      this.log.info(`Network monitor started with inotifywait on PID: ${this.monitorProcess.pid}`);
      
      // Agregar monitoreo periódico adicional para detectar cambios que inotify no puede capturar
      // Especialmente útil cuando la desconexión física del cable no dispara eventos en operstate/carrier
      this.startPeriodicConnectivityCheck();
      
    } catch (error) {
      this.log.error("Failed to start network monitor:", error);
      // Intentar con fs.watch como fallback
      if (this.ethernetInterface) {
        const operstatePath = `/sys/class/net/${this.ethernetInterface}/operstate`;
        const carrierPath = `/sys/class/net/${this.ethernetInterface}/carrier`;
        this.watchWithFsWatch(operstatePath, carrierPath);
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
   * Inicia verificación periódica de conectividad para detectar cambios que inotify puede perderse
   * Especialmente útil cuando la desconexión física no se refleja en operstate/carrier
   */
  private startPeriodicConnectivityCheck(): void {
    // Verificar cada 10 segundos si hay conectividad real
    const checkInterval = 10000; // 10 segundos
    
    setInterval(async () => {
      try {
        if (!this.ethernetInterface) return;
        
        const currentStatus = this.networkConfig?.status;
        
        // CASO 1: Si creemos que estamos conectados, verificar si perdimos conectividad
        if (currentStatus === 'connected') {
          let hasConnectivity = false;
          try {
            const { stdout: gatewayOutput } = await execAsync(`ip -j route show default dev ${this.ethernetInterface}`);
            const routes = JSON.parse(gatewayOutput);
            if (routes && routes[0] && routes[0].gateway) {
              const gateway = routes[0].gateway;
              await execAsync(`ping -c 1 -W 1 ${gateway}`, { timeout: 2000 });
              hasConnectivity = true;
            }
          } catch (error) {
            hasConnectivity = false;
            this.log.info(`Periodic connectivity check failed - cable may be disconnected: ${(error as Error).message}`);
          }
          
          // Si perdimos conectividad, actualizar estado inmediatamente como desconectado
          if (!hasConnectivity) {
            this.log.warn("Periodic check detected connectivity loss - updating status to DISCONNECTED immediately");
            
            // Actualizar estado inmediatamente sin esperar a fetchNetworkStatus completo
            this.updateNetworkConfig({
              interfaceName: this.ethernetInterface,
              status: NetworkStatus.DISCONNECTED,
              dhcpEnabled: this.networkConfig.dhcpEnabled,
              ipv4Address: "0.0.0.0",
              subnetMask: "0.0.0.0",
              gateway: "0.0.0.0",
              dnsServers: ["0.0.0.0"]
            });
            
            // Luego hacer la verificación completa para asegurar consistencia
            setTimeout(() => this.fetchNetworkStatus(), 1000);
          }
        }
        
        // CASO 2: Si estamos desconectados, verificar si se reconectó
        else if (currentStatus === 'disconnected' || !currentStatus) {
          this.log.info("Periodic check - Currently disconnected, checking for reconnection...");
          
          // Verificar si el carrier está activo (cable conectado físicamente)
          let isPhysicallyReconnected = false;
          try {
            const { stdout: carrierOutput } = await execAsync(`cat /sys/class/net/${this.ethernetInterface}/carrier 2>/dev/null || echo "0"`);
            const hasCarrier = carrierOutput.trim() === "1";
            
            const { stdout: operOutput } = await execAsync(`cat /sys/class/net/${this.ethernetInterface}/operstate 2>/dev/null || echo "down"`);
            const isUp = operOutput.trim() === "up";
            
            isPhysicallyReconnected = hasCarrier && isUp;
            
            this.log.debug(`Reconnection check: carrier=${hasCarrier}, operstate=${operOutput.trim()}, physicallyReconnected=${isPhysicallyReconnected}`);
          } catch (error) {
            this.log.debug(`Error checking physical reconnection: ${(error as Error).message}`);
          }
          
          // Si detectamos reconexión física, hacer verificación completa inmediatamente
          if (isPhysicallyReconnected) {
            this.log.warn("Periodic check detected physical reconnection - triggering full network status check");
            setTimeout(() => this.fetchNetworkStatus(), 500);
          }
        }
      } catch (error) {
        this.log.debug("Error in periodic connectivity check:", error);
      }
    }, checkInterval);
    
    this.log.info(`Periodic connectivity check started (every ${checkInterval/1000}s)`);
  }

  /**
   * Fallback: Monitoreo usando fs.watch de Node.js (sin dependencias externas)
   */
  private watchWithFsWatch(operstatePath: string, carrierPath?: string): void {
    try {
      // Verificar que el archivo operstate existe antes de intentar monitorearlo
      if (!fsSync.existsSync(operstatePath)) {
        this.log.error(`Cannot monitor ${operstatePath}: file does not exist`);
        return;
      }
      
      const watchers: fsSync.FSWatcher[] = [];
      let debounceTimer: NodeJS.Timeout | null = null;
      
      const handleChange = (eventType: string, filename: string | null) => {
        // Debounce: evitar múltiples llamadas rápidas
        if (debounceTimer) clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
          this.log.info(`Network change detected (fs.watch, event: ${eventType}, file: ${filename})`);
          this.fetchNetworkStatus();
        }, 500);
      };
      
      const handleError = (error: Error) => {
        this.log.error("fs.watch error:", error);
        // Cerrar watchers existentes
        watchers.forEach(w => w.close());
        // Intentar reiniciar el monitor después de un error
        setTimeout(() => {
          this.log.info("Attempting to restart fs.watch monitor");
          this.watchWithFsWatch(operstatePath, carrierPath);
        }, 5000);
      };
      
      // Monitor operstate
      const operstateWatcher = fsSync.watch(operstatePath);
      operstateWatcher.on("change", handleChange);
      operstateWatcher.on("error", handleError);
      watchers.push(operstateWatcher);
      
      // Monitor carrier si está disponible
      if (carrierPath && fsSync.existsSync(carrierPath)) {
        try {
          const carrierWatcher = fsSync.watch(carrierPath);
          carrierWatcher.on("change", handleChange);
          carrierWatcher.on("error", handleError);
          watchers.push(carrierWatcher);
          this.log.info(`Network monitor started using fs.watch (fallback mode) on ${operstatePath} and ${carrierPath}`);
        } catch (error) {
          this.log.warn(`Could not monitor carrier file ${carrierPath}:`, error);
          this.log.info(`Network monitor started using fs.watch (fallback mode) on ${operstatePath} only`);
        }
      } else {
        this.log.info(`Network monitor started using fs.watch (fallback mode) on ${operstatePath}`);
      }
      
      // Agregar monitoreo periódico también para fs.watch
      this.startPeriodicConnectivityCheck();
      
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
          // Configurar estado desconectado
          this.updateNetworkConfig({
            interfaceName: "eth0",
            status: NetworkStatus.DISCONNECTED,
            dhcpEnabled: true,
            ipv4Address: "0.0.0.0",
            subnetMask: "0.0.0.0", 
            gateway: "0.0.0.0",
            dnsServers: ["0.0.0.0"]
          });
          return;
        }
      }

      const iface = this.ethernetInterface;
      this.log.debug(`Fetching network status for interface: ${iface}`);
      
      // Leer estado operacional desde sysfs
      const operstatePath = `/sys/class/net/${iface}/operstate`;
      const carrierPath = `/sys/class/net/${iface}/carrier`;
      
      const operstate = (await fs.readFile(operstatePath, "utf-8")).trim();
      this.log.debug(`Interface ${iface} operstate: ${operstate}`);
      
      // Leer estado del carrier (detección de cable físico)
      let hasCarrier = false;
      let carrierReliable = true;
      
      try {
        const carrier = (await fs.readFile(carrierPath, "utf-8")).trim();
        hasCarrier = carrier === "1";
        this.log.debug(`Interface ${iface} carrier: ${carrier} (hasCarrier: ${hasCarrier})`);
      } catch (error) {
        this.log.debug(`Cannot read carrier status for ${iface}: ${(error as Error).message}`);
        carrierReliable = false;
        // Si no podemos leer carrier, asumimos que está basado en operstate
        hasCarrier = operstate === "up";
      }
      
      // Si carrier parece no ser confiable (siempre 1), usar prueba de conectividad
      let hasConnectivity = true;
      if (carrierReliable && hasCarrier && operstate === "up") {
        try {
          // Prueba rápida de conectividad al gateway por defecto
          const { stdout: gatewayOutput } = await execAsync(`ip -j route show default dev ${iface}`);
          const routes = JSON.parse(gatewayOutput);
          if (routes && routes[0] && routes[0].gateway) {
            const gateway = routes[0].gateway;
            // Ping rápido (1 segundo timeout, 1 intento)
            await execAsync(`ping -c 1 -W 1 ${gateway}`, { timeout: 2000 });
            hasConnectivity = true;
            this.log.debug(`Connectivity test to gateway ${gateway}: OK`);
          }
        } catch (error) {
          hasConnectivity = false;
          this.log.debug(`Connectivity test failed - possible physical disconnection: ${(error as Error).message}`);
        }
      }
      
      const isUp = operstate === "up";
      
      // Una interfaz está realmente conectada si:
      // 1. operstate es "up" AND
      // 2. (tiene carrier OR carrier no es confiable) AND  
      // 3. tiene conectividad al gateway
      const isPhysicallyConnected = isUp && (hasCarrier || !carrierReliable) && hasConnectivity;
      
      // Si la interfaz está down o no tiene conectividad real, reportar temprano
      if (!isPhysicallyConnected) {
        const reasons = [];
        if (!isUp) reasons.push(`operstate: ${operstate}`);
        if (!hasCarrier && carrierReliable) reasons.push("no carrier");
        if (!hasConnectivity) reasons.push("no connectivity to gateway");
        
        const reason = reasons.length > 0 ? reasons.join(", ") : "unknown";
        this.log.warn(`Interface ${iface} is not physically connected (${reason}), network not ready`);
        
        // Configurar estado desconectado pero no actualizar si ya estamos en un estado válido
        // Esto evita sobrescribir una configuración válida durante reintentos
        if (!this.networkConfig || this.networkConfig.status === NetworkStatus.DISCONNECTED) {
          this.updateNetworkConfig({
            interfaceName: iface,
            status: NetworkStatus.DISCONNECTED,
            dhcpEnabled: true,
            ipv4Address: "0.0.0.0",
            subnetMask: "0.0.0.0",
            gateway: "0.0.0.0",
            dnsServers: ["0.0.0.0"]
          });
        }
        return;
      }
      
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
        
        // Buscar la primera dirección IPv4 PRIMARIA que no sea loopback
        // Priorizar IPs primarias sobre secundarias
        const ipv4 = addr_info.find((a: any) => 
          a.family === "inet" && 
          a.local && 
          !a.local.startsWith("127.") &&
          !a.secondary  // Ignorar IPs secundarias
        ) || addr_info.find((a: any) => 
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
      
      // Método 1: Verificar si la IP PRIMARIA tiene flag "dynamic" en el JSON
      // Ignorar IPs secundarias ya que pueden existir configuraciones mixtas
      if (ipData && ipData.length > 0 && ipData[0] && ipData[0].addr_info) {
        const ipv4Info = ipData[0].addr_info.find((a: any) => 
          a.family === "inet" && 
          a.local && 
          !a.local.startsWith("127.") &&
          !a.secondary  // Ignorar IPs secundarias
        );
        if (ipv4Info && ipv4Info.dynamic === true) {
          dhcpDetected = true;
          this.log.debug("DHCP detected via 'dynamic' flag in primary IP data");
        }
      }
      
      // Método 2: Buscar procesos DHCP si el método anterior no funcionó
      if (!dhcpDetected) {
        try {
          // Buscar procesos DHCP reales (no comandos remotos que contengan las palabras)
          await execAsync(`pgrep -x dhclient || pgrep -x dhcpcd`);
          dhcpDetected = true;
          this.log.debug("DHCP client process detected");
        } catch {
          // Método 3: Verificar archivos de configuración típicos de DHCP
          try {
            const { stdout } = await execAsync(`ls /var/lib/dhcp/dhclient.*.leases 2>/dev/null`);
            if (stdout.trim()) {
              dhcpDetected = true;
              this.log.debug("DHCP lease files found");
            }
          } catch {
            this.log.debug("No DHCP indicators found, assuming static IP");
          }
        }
      }
      
      dhcpEnabled = dhcpDetected;
      
      // Mejorar la lógica de detección de estado
      // Una interfaz está conectada si:
      // 1. El operstate es "up" Y tiene carrier (físicamente conectada) Y
      // 2. Tiene una dirección IP válida (no 0.0.0.0) Y
      // 3. La dirección IP no es de loopback
      const hasValidIP = ipv4Address && ipv4Address !== "0.0.0.0" && !ipv4Address.startsWith("127.");
      const status = isPhysicallyConnected && hasValidIP ? NetworkStatus.CONNECTED : NetworkStatus.DISCONNECTED;
      
      this.log.debug(`Status determination: isPhysicallyConnected=${isPhysicallyConnected} (up=${isUp}, carrier=${hasCarrier}, connectivity=${hasConnectivity}), hasValidIP=${hasValidIP}, finalStatus=${status}`);
      
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
      // Configurar DHCP - limpiar configuración estática en el orden correcto
      await execAsync(`nmcli connection modify "${connectionName}" ipv4.method auto ipv4.addresses "" ipv4.gateway "" ipv4.dns ""`);
    } else {
      // Configurar IP estática
      const { ipv4Address, subnetMask, gateway, dnsServers } = config;
      
      this.log.info(`Configuring static IP: ${ipv4Address}, subnet: ${subnetMask}, gateway: ${gateway}`);
      
      // Calcular CIDR desde subnet mask
      const cidr = this.subnetMaskToPrefixLen(subnetMask);
      const ipWithCidr = `${ipv4Address}/${cidr}`;
      
      this.log.info(`Setting IP with CIDR: ${ipWithCidr}`);
      
      // Configurar método manual y direcciones en un solo comando para evitar que addresses quede vacío
      await execAsync(`nmcli connection modify "${connectionName}" ipv4.method manual ipv4.addresses "${ipWithCidr}"`);
      await execAsync(`nmcli connection modify "${connectionName}" ipv4.gateway "${gateway}"`);
      
      if (dnsServers && dnsServers.length > 0) {
        const dnsString = dnsServers.join(" ");
        this.log.info(`Setting DNS servers: ${dnsString}`);
        await execAsync(`nmcli connection modify "${connectionName}" ipv4.dns "${dnsString}"`);
      } else {
        this.log.info("No DNS servers provided, clearing DNS configuration");
        await execAsync(`nmcli connection modify "${connectionName}" ipv4.dns ""`);
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
    if (parts.length !== 4 || parts.some(p => p < 0 || p > 255)) {
      this.log.warn(`Invalid subnet mask: ${subnetMask}, using default /24`);
      return 24;
    }
    
    const binary = parts.map(p => p.toString(2).padStart(8, "0")).join("");
    
    // Contar bits consecutivos de '1' desde el inicio
    let prefixLen = 0;
    for (let i = 0; i < binary.length; i++) {
      if (binary[i] === '1') {
        prefixLen++;
      } else {
        break;
      }
    }
    
    this.log.debug(`Subnet mask ${subnetMask} converted to /${prefixLen}`);
    return prefixLen;
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
