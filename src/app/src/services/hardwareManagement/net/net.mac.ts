import { NetworkConfiguration, NetworkStatus } from "@common/types/network";
import { NetworkManager } from "./index.js";
import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Implementación de NetworkManager para macOS
 * Monitorea ÚNICAMENTE conexiones Ethernet (no WiFi)
 *
 * Estrategia:
 * - On-demand: networksetup/ifconfig/scutil para obtener configuración actual
 * - On-event: Utiliza 'scutil' con '--notify' para monitorear cambios en configuración de red
 *   También usa callbacks de SystemConfiguration framework vía script
 *
 * Eventos emitidos:
 * - NETWORK_INTERFACES_UPDATED
 * - NETWORK_DISCONNECTED
 * - NETWORK_CONNECTING
 * - NETWORK_CONNECTED
 */
export class NetworkManagerMac extends NetworkManager {

  private monitorProcess: ChildProcess | null = null;
  private ethernetInterface: string | null = null;
  private ethernetService: string | null = null;

  constructor(networkConfig?: NetworkConfiguration) {
    super(networkConfig);
  }

  /**
   * Detecta la primera interfaz Ethernet disponible y su servicio de NetworkSetup
   * En macOS: en0, en1, etc. (excluye WiFi que típicamente es en0 en MacBooks, pero en Ethernet puede ser en0 en Mac Mini)
   */
  private async detectEthernetInterface(): Promise<{ interface: string; service: string } | null> {
    try {
      // Listar todos los servicios de red
      const { stdout: servicesOutput } = await execAsync("networksetup -listallhardwareports");
      
      // Parse para encontrar hardware Ethernet (no WiFi, no Bluetooth, no Thunderbolt Bridge)
      const lines = servicesOutput.split("\n");
      const hardwarePorts: { name: string; device: string; type: string }[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith("Hardware Port:")) {
          const portName = line.replace("Hardware Port:", "").trim();
          const deviceLine = lines[i + 1]?.trim() || "";
          const device = deviceLine.replace("Device:", "").trim();
          
          // Filtrar solo interfaces Ethernet
          if (
            (portName.toLowerCase().includes("ethernet") || 
             portName.toLowerCase().includes("usb 10/100/1000")) &&
            !portName.toLowerCase().includes("wi-fi") &&
            !portName.toLowerCase().includes("wireless") &&
            !portName.toLowerCase().includes("bluetooth") &&
            !portName.toLowerCase().includes("thunderbolt bridge") &&
            device && device.startsWith("en")
          ) {
            hardwarePorts.push({ name: portName, device, type: "ethernet" });
          }
        }
      }
      
      if (hardwarePorts.length === 0) {
        this.log.warn("No Ethernet hardware port found");
        return null;
      }
      
      // Seleccionar el primero encontrado
      const selected = hardwarePorts[0];
      this.log.info(`Detected Ethernet interface: ${selected.device} (${selected.name})`);
      
      return {
        interface: selected.device,
        service: selected.name
      };
      
    } catch (error) {
      this.log.error("Failed to detect Ethernet interface:", error);
      return null;
    }
  }

  /**
   * Monitorea cambios de red usando 'scutil' que es el método nativo de macOS
   * scutil --notify monitorea cambios en la configuración de SystemConfiguration
   */
  protected async watchForNetworkChanges(): Promise<void> {
    try {
      const detection = await this.detectEthernetInterface();
      
      if (!detection) {
        this.log.warn("No Ethernet interface to monitor");
        return;
      }
      
      this.ethernetInterface = detection.interface;
      this.ethernetService = detection.service;
      
      this.log.info(`Starting network monitor for ${this.ethernetInterface} using scutil`);
      
      // Usar scutil para monitorear cambios en State:/Network/Global/IPv4
      // Este comando se bloquea y emite una línea cada vez que hay un cambio
      this.monitorProcess = spawn("scutil", []);
      
      if (this.monitorProcess.stdin) {
        // Comandos para monitorear cambios en la configuración de red
        this.monitorProcess.stdin.write("n.add State:/Network/Global/IPv4\n");
        this.monitorProcess.stdin.write("n.add State:/Network/Global/DNS\n");
        this.monitorProcess.stdin.write(`n.add State:/Network/Interface/${this.ethernetInterface}/Link\n`);
        this.monitorProcess.stdin.write(`n.add State:/Network/Interface/${this.ethernetInterface}/IPv4\n`);
        this.monitorProcess.stdin.write("n.watch\n");
      }
      
      let debounceTimer: NodeJS.Timeout | null = null;
      
      this.monitorProcess.stdout?.on("data", (data) => {
        const output = data.toString().trim();
        if (output && output.includes("notification")) {
          this.log.info("Network change detected:", output);
          
          // Debounce: evitar múltiples llamadas rápidas cuando hay varios cambios simultáneos
          if (debounceTimer) clearTimeout(debounceTimer);
          
          debounceTimer = setTimeout(() => {
            this.fetchNetworkStatus();
          }, 500);
        }
      });
      
      this.monitorProcess.stderr?.on("data", (data) => {
        const error = data.toString().trim();
        if (error) {
          this.log.error("Network monitor error:", error);
        }
      });
      
      this.monitorProcess.on("error", (error) => {
        this.log.error("Failed to start scutil monitor:", error);
      });
      
      this.monitorProcess.on("exit", (code) => {
        if (code !== 0 && code !== null) {
          this.log.warn(`scutil monitor exited with code ${code}`);
        }
      });
      
      this.log.info(`Network monitor started on PID: ${this.monitorProcess.pid}`);
      
    } catch (error) {
      this.log.error("Failed to start network monitor:", error);
    }
  }

  /**
   * Obtiene el estado actual de la interfaz Ethernet usando comandos nativos de macOS
   */
  protected async fetchNetworkStatus(): Promise<void> {
    try {
      if (!this.ethernetInterface || !this.ethernetService) {
        const detection = await this.detectEthernetInterface();
        if (!detection) {
          this.log.warn("No Ethernet interface available");
          return;
        }
        this.ethernetInterface = detection.interface;
        this.ethernetService = detection.service;
      }

      const iface = this.ethernetInterface;
      const service = this.ethernetService;
      
      // Verificar si la interfaz está activa (cable conectado)
      let isUp = false;
      try {
        const { stdout: ifconfigOutput } = await execAsync(`ifconfig ${iface}`);
        isUp = ifconfigOutput.includes("status: active") && !ifconfigOutput.includes("status: inactive");
      } catch {
        isUp = false;
      }
      
      // Obtener configuración IP usando networksetup
      let ipv4Address = "";
      let subnetMask = "";
      let gateway = "";
      let dnsServers: string[] = [];
      let dhcpEnabled = true;
      
      try {
        // Verificar si usa DHCP
        const { stdout: dhcpCheck } = await execAsync(`networksetup -getinfo "${service}"`);
        
        if (dhcpCheck.includes("DHCP Configuration")) {
          dhcpEnabled = true;
        } else if (dhcpCheck.includes("Manual Configuration") || dhcpCheck.includes("Manually")) {
          dhcpEnabled = false;
        }
        
        // Extraer IP, subnet mask, gateway del output
        const ipMatch = dhcpCheck.match(/IP address:\s*([0-9.]+)/i);
        const subnetMatch = dhcpCheck.match(/Subnet mask:\s*([0-9.]+)/i);
        const gatewayMatch = dhcpCheck.match(/Router:\s*([0-9.]+)/i);
        
        if (ipMatch) ipv4Address = ipMatch[1];
        if (subnetMatch) subnetMask = subnetMatch[1];
        if (gatewayMatch) gateway = gatewayMatch[1];
        
      } catch (error) {
        this.log.warn("Could not get IP configuration:", error);
      }
      
      // Obtener DNS servers
      try {
        const { stdout: dnsOutput } = await execAsync(`networksetup -getdnsservers "${service}"`);
        
        if (!dnsOutput.includes("There aren't any DNS Servers")) {
          dnsServers = dnsOutput
            .trim()
            .split("\n")
            .map(line => line.trim())
            .filter(ip => ip && /^[0-9.]+$/.test(ip));
        }
      } catch (error) {
        this.log.warn("Could not get DNS servers:", error);
      }
      
      // Si no hay IP por networksetup, intentar con ifconfig/scutil
      if (!ipv4Address) {
        try {
          const { stdout: ifconfigOutput } = await execAsync(`ifconfig ${iface} | grep "inet " | awk '{print $2}'`);
          ipv4Address = ifconfigOutput.trim();
          
          // Obtener netmask de ifconfig
          const { stdout: netmaskOutput } = await execAsync(`ifconfig ${iface} | grep "inet " | awk '{print $4}'`);
          const hexMask = netmaskOutput.trim();
          if (hexMask.startsWith("0x")) {
            subnetMask = this.hexToSubnetMask(hexMask);
          }
        } catch {
          // No se pudo obtener por ifconfig
        }
      }
      
      // Obtener gateway desde route si no se obtuvo
      if (!gateway) {
        try {
          const { stdout: routeOutput } = await execAsync("route -n get default | grep gateway | awk '{print $2}'");
          gateway = routeOutput.trim();
        } catch {
          // No gateway configurado
        }
      }
      
      const status = isUp && ipv4Address ? NetworkStatus.CONNECTED : NetworkStatus.DISCONNECTED;
      
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
   * Convierte máscara hexadecimal de ifconfig a formato decimal (x.x.x.x)
   */
  private hexToSubnetMask(hexMask: string): string {
    const hex = hexMask.replace("0x", "");
    const num = parseInt(hex, 16);
    return [
      (num >>> 24) & 0xff,
      (num >>> 16) & 0xff,
      (num >>> 8) & 0xff,
      num & 0xff
    ].join(".");
  }

  /**
   * Establece la configuración de red en macOS usando networksetup
   */
  async setNetworkConfiguration(config: NetworkConfiguration): Promise<void> {
    try {
      if (!this.ethernetService) {
        const detection = await this.detectEthernetInterface();
        if (!detection) {
          throw new Error("No Ethernet interface available");
        }
        this.ethernetService = detection.service;
        this.ethernetInterface = detection.interface;
      }

      const service = this.ethernetService;
      const { ipv4Address, subnetMask, gateway, dnsServers, dhcpEnabled } = config;
      
      if (dhcpEnabled) {
        // Configurar DHCP
        this.log.info(`Configuring ${service} to use DHCP`);
        await execAsync(`networksetup -setdhcp "${service}"`);
        
        // Limpiar DNS (usar los del DHCP)
        await execAsync(`networksetup -setdnsservers "${service}" "Empty"`);
        
      } else {
        // Configurar IP estática
        this.log.info(`Configuring ${service} with static IP: ${ipv4Address}`);
        
        await execAsync(`networksetup -setmanual "${service}" ${ipv4Address} ${subnetMask} ${gateway}`);
        
        // Configurar DNS
        if (dnsServers && dnsServers.length > 0) {
          const dnsString = dnsServers.join(" ");
          await execAsync(`networksetup -setdnsservers "${service}" ${dnsString}`);
        }
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
