import { NetworkEvents } from "@common/events/network.events";
import { NetworkConfiguration, NetworkManagerInterface, NetworkStatus } from "@common/types/network";
import { EventEmitter } from "events";
import { ChildProcess } from 'child_process';
import { Log } from '@src/utils/log';
import { broadcastToClients } from "@src/services/ipcServices/index.js";

const log = Log.createInstance('Network Manager', false);

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
  private static logger = Log.createInstance(`Network Manager [static:${process.platform}]`, false);

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

    // Iniciar monitoreo de cambios primero
    this.watchForNetworkChanges()
    
    // Iniciar detección de estado con reintentos
    this.initNetworkStatusWithRetry();
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
        const { NetworkManagerLinux } = await import("./net.linux.js");
        const instance = new NetworkManagerLinux(networkConfig);
        NetworkManager.instance = instance;
        return instance;
      }
      case "darwin": {
        const { NetworkManagerMac } = await import("./net.mac.js");
        const instance = new NetworkManagerMac(networkConfig);
        NetworkManager.instance = instance;
        return instance;
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
    // Solo validar campos estáticos cuando no se usa DHCP
    if (!config.dhcpEnabled) {
      if (!config.dnsServers || !Array.isArray(config.dnsServers) || config.dnsServers.length === 0) {
        throw new Error("DNS servers are required for static configuration");
      }
      if (!config.gateway || !config.ipv4Address || !config.subnetMask) {
        throw new Error("IP address, gateway and subnet mask are required for static configuration");
      }
    }
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
  async getNetworkStatus(): Promise<NetworkConfiguration> {
    try {
      // Forzar actualización desde el sistema operativo
      await this.fetchNetworkStatus();
    } catch (error) {
      this.log.warn("Failed to fetch fresh network status, using cached:", error);
    }
    return this.networkConfig;
  }

  /**
   * Inicializa el estado de red con mecanismo de reintentos
   * Útil para resolver problemas de timing durante el inicio del sistema
   */
  private async initNetworkStatusWithRetry(): Promise<void> {
    const maxRetries = 5;
    const baseDelay = 1000; // 1 segundo
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log.info(`Network status initialization attempt ${attempt}/${maxRetries}`);
        
        await this.fetchNetworkStatus();
        
        // Verificar si obtuvimos una configuración válida
        if (this.networkConfig && this.hasValidNetworkConfig()) {
          this.log.info(`Network status initialized successfully on attempt ${attempt}`);
          return;
        }
        
        // Si llegamos aquí, la red no está lista aún
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(1.5, attempt - 1); // Delay progresivo
          this.log.warn(`Network not ready, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.log.warn('Network initialization completed with maximum retries, network may not be ready');
        }
        
      } catch (error) {
        this.log.error(`Network initialization attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(1.5, attempt - 1);
          this.log.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  /**
   * Verifica si la configuración de red actual es válida
   */
  private hasValidNetworkConfig(): boolean {
    if (!this.networkConfig) return false;
    
    // Considerar válida si tiene una IP que no sea 0.0.0.0 y el estado sea conectado
    const hasValidIP = this.networkConfig.ipv4Address && 
                      this.networkConfig.ipv4Address !== '0.0.0.0' &&
                      !this.networkConfig.ipv4Address.startsWith('127.');
    
    const isConnected = this.networkConfig.status === 'connected';
    
    return hasValidIP && isConnected;
  }

  /**
   * Fuerza una actualización del estado de red con reintentos
   * Útil para debugging o cuando se sospecha que la red ha cambiado
   */
  async refreshNetworkStatusWithRetry(): Promise<void> {
    this.log.info('Manual network status refresh with retry requested');
    await this.initNetworkStatusWithRetry();
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
