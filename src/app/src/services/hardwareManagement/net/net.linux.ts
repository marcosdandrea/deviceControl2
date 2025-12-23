import { NetworkConfiguration, NetworkStatus } from "@common/types/network";
import { NetworkManager } from "./index";
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Implementación de NetworkManager para Linux
 * Monitorea ÚNICAMENTE conexiones Ethernet (no WiFi)
 * 
 * Usa 'ip monitor' para eventos en tiempo real del kernel
 * No requiere polling, es 100% event-driven
 */
export class NetworkManagerLinux extends NetworkManager {
  constructor(networkConfig?: NetworkConfiguration) {
    super(networkConfig);
  }

  protected watchForNetworkChanges(): void {
    this.startLinuxNetworkMonitoring();
  }

  /**
   * Establece la configuración de red ethernet en Linux usando nmcli
   */
  async setNetworkConfiguration(config: NetworkConfiguration): Promise<void> {
    try {
      this.log.info('Setting network configuration on Linux with nmcli...');

      // Buscar la interfaz ethernet activa
      const interfaceName = await this.getEthernetInterface();

      if (!interfaceName) {
        throw new Error('No ethernet interface found');
      }

      this.log.info(`Configuring ethernet interface: ${interfaceName}`);

      // Calcular la longitud del prefijo (CIDR) desde la máscara de subred
      const prefixLength = this.subnetMaskToCIDR(config.subnetMask);

      // Construir comandos nmcli
      const commands = [
        // Establecer método manual (IP estática)
        `nmcli con modify "${interfaceName}" ipv4.method manual`,
        // Establecer dirección IP con máscara
        `nmcli con modify "${interfaceName}" ipv4.addresses "${config.ipv4Address}/${prefixLength}"`,
        // Establecer gateway
        `nmcli con modify "${interfaceName}" ipv4.gateway "${config.gateway}"`,
        // Establecer servidores DNS
        `nmcli con modify "${interfaceName}" ipv4.dns "${config.dnsServers.join(' ')}"`,
        // Aplicar cambios (reactivar conexión)
        `nmcli con up "${interfaceName}"`
      ];

      // Ejecutar comandos secuencialmente
      for (const command of commands) {
        this.log.debug(`Executing: ${command}`);
        const { stdout, stderr } = await execPromise(command);

        if (stderr && !stderr.includes('Warning')) {
          this.log.warn(`Command stderr: ${stderr}`);
        }

        if (stdout) {
          this.log.debug(`Command stdout: ${stdout}`);
        }
      }

      this.networkConfig = config;
      this.log.info('Network configuration applied successfully');
    } catch (error) {
      this.log.error('Failed to set network configuration:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado actual de la red ethernet en Linux usando nmcli
   */
  async getNetworkStatus(): Promise<NetworkConfiguration> {
    try {
      this.log.info('Getting network status on Linux with nmcli...');

      // Buscar la interfaz ethernet activa
      const interfaceName = await this.getEthernetInterface();

      if (!interfaceName) {
        throw new Error('No ethernet interface found');
      }

      this.log.info(`Reading ethernet interface: ${interfaceName}`);

      // Obtener información de la interfaz usando nmcli
      const { stdout } = await execPromise(
        `nmcli -t -f IP4.ADDRESS,IP4.GATEWAY,IP4.DNS device show "${interfaceName}"`
      );

      // Parsear salida de nmcli
      const lines = stdout.trim().split('\n');
      let ipv4Address = '';
      let subnetMask = '';
      let gateway = '';
      const dnsServers: string[] = [];

      for (const line of lines) {
        if (line.startsWith('IP4.ADDRESS')) {
          // Formato: IP4.ADDRESS[1]:192.168.1.100/24
          const match = line.match(/IP4\.ADDRESS\[\d+\]:([^/]+)\/(\d+)/);
          if (match) {
            ipv4Address = match[1];
            // Convertir CIDR a máscara de subred
            subnetMask = this.cidrToSubnetMask(parseInt(match[2]));
          }
        } else if (line.startsWith('IP4.GATEWAY')) {
          // Formato: IP4.GATEWAY:192.168.1.1
          const match = line.match(/IP4\.GATEWAY:(.+)/);
          if (match) {
            gateway = match[1].trim();
          }
        } else if (line.startsWith('IP4.DNS')) {
          // Formato: IP4.DNS[1]:8.8.8.8
          const match = line.match(/IP4\.DNS\[\d+\]:(.+)/);
          if (match) {
            dnsServers.push(match[1].trim());
          }
        }
      }

      const networkStatus: NetworkConfiguration = {
        interfaceName: interfaceName,
        status: ipv4Address ? NetworkStatus.CONNECTED : NetworkStatus.DISCONNECTED,
        dhcp: false, // Asumimos IP estática si estamos leyendo configuración manual
        ipv4Address: ipv4Address || this.networkConfig.ipv4Address,
        subnetMask: subnetMask || this.networkConfig.subnetMask,
        gateway: gateway || this.networkConfig.gateway,
        dnsServers: dnsServers.length > 0 ? dnsServers : this.networkConfig.dnsServers
      };

      this.log.info('Network status retrieved successfully');
      return networkStatus;
    } catch (error) {
      this.log.error('Failed to get network status:', error);
      // Si falla, devolver la configuración almacenada
      return this.networkConfig;
    }
  }

  private startLinuxNetworkMonitoring() {
    try {
      // 'ip monitor' escucha eventos del netlink socket del kernel
      // Emite eventos instantáneamente cuando hay cambios en interfaces ethernet
      this.networkMonitor = exec('ip monitor link address route', {
        encoding: 'utf8'
      });

      this.networkMonitor.stdout?.on('data', (data: string) => {
        this.log.debug('Linux ethernet event:', data);

        // Cambios en interfaces (link up/down, nueva interfaz, etc.)
        if (data.includes('link') || data.includes('address') || data.includes('route')) {
          this.handleNetworkChange();
        }
      });

      this.networkMonitor.stderr?.on('data', (error: string) => {
        this.log.error('Error in Linux network monitor:', error);
      });

      this.networkMonitor.on('exit', (code) => {
        this.log.warn(`Linux network monitor exited with code ${code}, restarting...`);
        setTimeout(() => this.startLinuxNetworkMonitoring(), 5000);
      });

      this.log.info('Linux network monitoring started (event-driven via ip monitor)');
    } catch (error) {
      this.log.error('Failed to start Linux network monitor:', error);
      throw error;
    }
  }

  /**
   * Obtiene la interfaz ethernet activa en el sistema
   */
  private async getEthernetInterface(): Promise<string | null> {
    try {
      // Listar todas las conexiones activas
      const { stdout } = await execPromise('nmcli -t -f NAME,TYPE,DEVICE connection show --active');

      const lines = stdout.trim().split('\n');

      for (const line of lines) {
        const [name, type, device] = line.split(':');

        // Buscar conexiones ethernet (tipo '802-3-ethernet')
        if (type === '802-3-ethernet' && device) {
          this.log.info(`Found ethernet interface: ${device} (${name})`);
          return name; // Retornar el nombre de la conexión
        }
      }

      this.log.warn('No active ethernet interface found');
      return null;
    } catch (error) {
      this.log.error('Error finding ethernet interface:', error);
      return null;
    }
  }

  /**
   * Convierte una máscara de subred a notación CIDR
   * Ejemplo: "255.255.255.0" -> 24
   */
  private subnetMaskToCIDR(mask: string): number {
    const parts = mask.split('.').map(Number);
    let cidr = 0;

    for (const part of parts) {
      cidr += part.toString(2).split('1').length - 1;
    }

    return cidr;
  }

  /**
   * Convierte notación CIDR a máscara de subred
   * Ejemplo: 24 -> "255.255.255.0"
   */
  private cidrToSubnetMask(cidr: number): string {
    const mask = [];

    for (let i = 0; i < 4; i++) {
      const n = Math.min(cidr, 8);
      mask.push(256 - Math.pow(2, 8 - n));
      cidr -= n;
    }

    return mask.join('.');
  }
}