import { NetworkEvents } from "@common/events/network.events";
import { NetworkConfiguration, NetworkManagerInterface, NetworkStatus } from "@common/types/network";
import { EventEmitter } from "events";
import { ChildProcess } from 'child_process';
import { Log } from '@src/utils/log';
import { broadcastToClients } from "@src/services/ipcServices/index.js";

const log = Log.createInstance('Network Manager', true);

/**
 * Clase base para el manejo de conexiones Ethernet
 * 
 * IMPORTANTE: Esta clase maneja ÚNICAMENTE conexiones Ethernet (cableadas).
 * No incluye WiFi ni otras interfaces inalámbricas.
 * 
 * Competencias:
 * - Monitorear cambios en la conexión ethernet (cable conectado/desconectado, cambio de IP, etc.)
 * - Establecer la configuración de conexión ethernet (IP estática, DHCP, DNS, gateway)
 * - Emitir eventos sobre cambios en la conexión ethernet
 * 
 * Las implementaciones específicas por plataforma deben extender de esta clase
 */
export abstract class NetworkManager extends EventEmitter implements NetworkManagerInterface {
  static instance: NetworkManagerInterface;
  networkConfig: NetworkConfiguration;
  protected networkMonitor: ChildProcess | null = null;
  protected log: Log;
  private static logger = Log.createInstance(`Network Manager [static:${process.platform}]`, true);

  constructor(networkConfig?: NetworkConfiguration) {
    super();

    this.log = Log.createInstance(`Network Manager [${process.platform}]`, true);

    if (networkConfig) {
      try {
        this.validateNetworkConfig(networkConfig);
        this.setNetworkConfiguration(networkConfig)
      } catch (error) {
        this.log.error('Invalid network configuration or method not available in this platform:', (error as Error).message);
      }
    }

    this.fetchNetworkStatus()
    this.watchForNetworkChanges()
  }

  /**
   * Crea la instancia apropiada según la plataforma
   */
  static async getInstance(networkConfig?: NetworkConfiguration): Promise<NetworkManagerInterface> {
    // Implementar singleton: si ya existe una instancia, devolverla
    if (NetworkManager.instance) {
      NetworkManager.logger.info('Returning existing NetworkManager instance');

      // Si se proporciona configuración nueva, aplicarla
      if (networkConfig) {
        NetworkManager.logger.info('Applying new network configuration to existing instance');
        NetworkManager.instance.setNetworkConfiguration(networkConfig).catch(error => {
          NetworkManager.logger.error('Failed to apply network configuration:', error);
        });
      }

      return NetworkManager.instance;
    }

    const platform = process.platform;

    NetworkManager.logger.info(`Creating NEW NetworkManager instance for platform: ${platform}`);

    switch (platform) {
      case "linux": {
        throw new Error("Linux platform is not yet implemented");
      }
      case "darwin": {
        throw new Error("macOS platform is not yet implemented");
      }
      case "win32": {
        const { NetworkManagerWin } = await import("./net.win.js");
        const instance = new NetworkManagerWin(networkConfig);
        NetworkManager.instance = instance;
        return instance;
      }
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  protected dispatchEvent(eventName: NetworkEvents, data?: any) {
    broadcastToClients(eventName, data);
    this.emit(eventName, data);
  }

  /**
   * Valida la configuración de red proporcionada asegurando que todos los campos necesarios estén presentes
   * @param config Configuración de red a validar según la estructura NetworkConfiguration
   */
  protected validateNetworkConfig(config: NetworkConfiguration) {
    if (!config.dnsServers || !Array.isArray(config.dnsServers) || config.dnsServers.length === 0 || !config.gateway || !config.ipv4Address || !config.subnetMask)
      throw new Error("Invalid network configuration");
  }



  /**
   * Actualiza la configuración de red almacenada internamente
   * @param config Nueva configuración de red
   */
  protected updateNetworkConfig(config: NetworkConfiguration) {
    this.log.info('Network configuration updated:', config);

    if (this.networkConfig?.status !== config.status) {
      if (config.status === NetworkStatus.CONNECTED) {
        this.dispatchEvent(NetworkEvents.NETWORK_CONNECTED, config);
        this.log.info('Network connected');
      } else if (config.status === NetworkStatus.DISCONNECTED) {
        this.dispatchEvent(NetworkEvents.NETWORK_DISCONNECTED, config);
        this.log.info('Network disconnected');
      }
    } 
    
    this.dispatchEvent(NetworkEvents.NETWORK_UPDATED, config);
    this.log.info('Network updated');
    
    this.networkConfig = config;
  }

  /**
   * Maneja los cambios de conexión ethernet detectados
   * Emite eventos según el estado de la conexión (conectado/desconectado)
   * 
   * NOTA: Filtra únicamente interfaces ethernet, excluyendo WiFi, loopback y otras interfaces
   */
  protected handleOnNetworkChange(NetworkConfigurations: NetworkConfiguration[]) {

  }

  /**
 * Método que debe ser implementado por cada plataforma
 * para monitorear cambios en la configuración de red ETHERNET únicamente
 * No debe monitorear cambios en WiFi u otras interfaces inalámbricas
 */
  protected abstract watchForNetworkChanges(): Promise<void>;

  /**
   * Método que debe ser implementado por cada plataforma
   * para obtener el estado actual de la red ethernet on-demand
   * NOTA: Debe devolver únicamente interfaces ethernet, excluyendo WiFi, loopback y otras interfaces
   */
  protected abstract fetchNetworkStatus(): Promise<void>;

  /**
   * Establece la configuración de red ethernet del sistema
   * Este método debe ser implementado por las clases específicas de cada plataforma
   * y solo disponible para linux
   * para aplicar configuraciones como IP, gateway, DNS, etc.
   */
  abstract setNetworkConfiguration(config: NetworkConfiguration): Promise<void>;

  /**
   * Obtiene el estado actual de la red ethernet del sistema
   * Este método debe ser implementado por las clases específicas de cada plataforma
   * para leer la configuración actual (IP, gateway, DNS, subnet mask, etc.)
   * 
   * @returns NetworkConfiguration con la información actualizada de la conexión ethernet
   */
  getNetworkStatus(): NetworkConfiguration {
    return this.networkConfig;
  }

  /**
   * Limpia recursos al destruir la instancia
   */
  destroy() {
    if (this.networkMonitor) {
      this.networkMonitor.kill();
      this.networkMonitor = null;
      this.log.info('Network monitor stopped');
    }
  }
}
