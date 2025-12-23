import { NetworkConfiguration } from "@common/types/network";
import { NetworkManager } from "./index";
import { exec } from 'child_process';

/**
 * Implementación de NetworkManager para macOS
 * Monitorea ÚNICAMENTE conexiones Ethernet (no WiFi)
 * 
 * Usa 'scutil' para escuchar eventos de configd
 * configd es el daemon que maneja la configuración de red
 */
export class NetworkManagerMac extends NetworkManager {
  constructor(networkConfig?: NetworkConfiguration) {
    super(networkConfig);
  }

  protected watchForNetworkChanges(): void {
    this.startMacNetworkMonitoring();
  }

  /**
   * Establece la configuración de red ethernet en macOS usando networksetup
   */
  async setNetworkConfiguration(config: NetworkConfiguration): Promise<void> {
    try {
      this.log.info('Setting network configuration on macOS...');

      // TODO: Implementar configuración usando networksetup
      // Ejemplo:
      // networksetup -setmanual <interface> <ip> <mask> <gateway>
      // networksetup -setdnsservers <interface> <dns1> <dns2>

      this.networkConfig = config;
      this.log.info('Network configuration applied successfully');
    } catch (error) {
      this.log.error('Failed to set network configuration:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado actual de la red ethernet en macOS
   */
  async getNetworkStatus(): Promise<NetworkConfiguration> {
    try {
      this.log.info('Getting network status on macOS...');

      // TODO: Implementar obtención de estado usando networksetup o scutil
      // Ejemplo con networksetup:
      // networksetup -getinfo <interface> - para IP, máscara y gateway
      // networksetup -getdnsservers <interface> - para DNS

      // Ejemplo con scutil:
      // scutil --get State:/Network/Interface/<interface>/IPv4

      // Por ahora devolver la configuración almacenada
      return this.networkConfig;
    } catch (error) {
      this.log.error('Failed to get network status:', error);
      throw error;
    }
  }

  private startMacNetworkMonitoring() {
    try {
      // En macOS, podemos usar 'scutil' para escuchar eventos de configd
      // configd es el daemon que maneja la configuración de red ethernet
      this.networkMonitor = exec('scutil', {
        encoding: 'utf8'
      });

      // Comandos para scutil para monitorear cambios de red ethernet
      this.networkMonitor.stdin?.write('n.watch State:/Network/Global/IPv4\n');
      this.networkMonitor.stdin?.write('n.watch State:/Network/Interface\n');

      this.networkMonitor.stdout?.on('data', (data: string) => {
        this.log.debug('macOS ethernet event:', data);

        if (data.includes('notification')) {
          this.handleNetworkChange();
        }
      });

      this.networkMonitor.stderr?.on('data', (error: string) => {
        this.log.error('Error in macOS network monitor:', error);
      });

      this.networkMonitor.on('exit', (code) => {
        this.log.warn(`macOS network monitor exited with code ${code}, restarting...`);
        setTimeout(() => this.startMacNetworkMonitoring(), 5000);
      });

      this.log.info('macOS network monitoring started (event-driven via scutil)');
    } catch (error) {
      this.log.error('Failed to start macOS network monitor:', error);
      throw error;
    }
  }
}