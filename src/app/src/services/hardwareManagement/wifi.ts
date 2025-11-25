import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import wifiEvents from '@common/events/wifi.events';
import { WiFiConnectionStatus, WiFiNetwork } from '@common/types/wifi.types';
import { Log } from '@src/utils/log';

const log = Log.createInstance('WiFi Service', true);

const execPromise = promisify(exec);

/**
 * Event Emitter para eventos de WiFi
 */
export const wifiEventEmitter = new EventEmitter();


/**
 * Obtiene un listado de todas las redes WiFi disponibles
 * @returns Promise con array de redes WiFi detectadas
 */
export async function getAvailableNetworks(): Promise<WiFiNetwork[]> {
    try {
        log.info('Getting available WiFi networks...');
        
        // Forzar un rescan de redes WiFi con sudo
        try {
            await execPromise('sudo nmcli device wifi rescan');
            // Esperar más tiempo para que el rescan se complete
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            // El rescan puede fallar si se hizo muy recientemente, pero no es crítico
            log.warn('WiFi rescan warning (not critical):', error);
            // Esperar un poco más si falló el rescan
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Escanear redes disponibles usando nmcli con --rescan yes para forzar
        const { stdout } = await execPromise(
            'nmcli -t -f SSID,SIGNAL,SECURITY,IN-USE device wifi list --rescan yes'
        );

        const networks: WiFiNetwork[] = [];
        const lines = stdout.trim().split('\n');

        for (const line of lines) {
            if (!line) continue;

            const [ssid, signal, security, inUse] = line.split(':');

            // Filtrar SSIDs vacíos o duplicados
            if (!ssid || ssid === '--') continue;

            // Verificar si ya existe esta SSID (tomar la de mayor señal)
            const existingIndex = networks.findIndex(n => n.ssid === ssid);
            const networkData: WiFiNetwork = {
                ssid,
                signal: parseInt(signal) || 0,
                security: security || 'Open',
                inUse: inUse === '*'
            };

            if (existingIndex >= 0) {
                // Si existe, mantener la que tiene mejor señal
                if (networkData.signal > networks[existingIndex].signal) {
                    networks[existingIndex] = networkData;
                }
            } else {
                networks.push(networkData);
            }
        }

        log.info(`Found ${networks.length} WiFi networks.`);
        // Ordenar por señal de mayor a menor
        return networks.sort((a, b) => b.signal - a.signal);

    } catch (error) {
        log.error('Error al obtener redes WiFi:', error);
        throw new Error(`No se pudieron obtener las redes WiFi: ${error}`);
    }
}

export type WiFiConnectionResult = {
    success: boolean;
    message: string;
    fallbackApplied?: boolean;
    previousSSID?: string;
};

/**
 * Conecta a una red WiFi específica con sistema de fallback
 * @param ssid - Nombre de la red WiFi
 * @param password - Contraseña de la red (opcional para redes abiertas)
 * @returns Promise con el resultado de la conexión
 */
export async function connectToNetwork(
    ssid: string,
    password?: string
): Promise<WiFiConnectionResult> {
    // Guardar la conexión actual antes de intentar cambiar
    const previousConnection = await getConnectionStatus();
    const hadPreviousConnection = previousConnection.connected && previousConnection.ssid;
    
    if (hadPreviousConnection) {
        log.info(`Current connection: ${previousConnection.ssid}. Will use as fallback if new connection fails.`);
    }

    try {
        log.info(`Connecting to WiFi network: ${ssid}`);
        
        // Verificar si ya existe una conexión guardada con este SSID
        let connectionExists = false;
        try {
            const { stdout } = await execPromise(
                `sudo nmcli -t -f NAME connection show`
            );
            connectionExists = stdout.includes(ssid);
        } catch (error) {
            // Si hay error, asumimos que no existe
            connectionExists = false;
        }

        // Intentar conectar con timeout de 15 segundos
        const connectionPromise = (async () => {
            if (connectionExists) {
                // Si la conexión ya existe, intentar conectar
                await execPromise(`sudo nmcli connection up "${ssid}"`);
            } else {
                // Si no existe, crear nueva conexión usando connection add
                if (password) {
                    // Crear la conexión con todos los parámetros necesarios
                    await execPromise(
                        `sudo nmcli connection add type wifi con-name "${ssid}" ifname '*' ssid "${ssid}" wifi-sec.key-mgmt wpa-psk wifi-sec.psk "${password}"`
                    );
                    // Activar la conexión recién creada
                    await execPromise(`sudo nmcli connection up "${ssid}"`);
                } else {
                    // Para redes abiertas, usar el comando simple
                    await execPromise(`sudo nmcli device wifi connect "${ssid}"`);
                }
            }
        })();

        // Timeout de 15 segundos
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
        );

        // Esperar la conexión o el timeout
        await Promise.race([connectionPromise, timeoutPromise]);

        // Esperar un momento adicional para que la conexión se estabilice
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verificar que la conexión fue exitosa
        const status = await getConnectionStatus();
        log.info(`Connection status after attempt: ${JSON.stringify(status)}`);

        if (!status.connected || status.ssid !== ssid) {
            throw new Error('Connection established but verification failed');
        }

        log.info(`Successfully connected to ${ssid}`);
        return {
            success: true,
            message: `Successfully connected to ${ssid}`
        };

    } catch (error) {
        log.error(`Error connecting to network ${ssid}:`, error);
        
        // Si había una conexión previa, intentar volver a ella
        if (hadPreviousConnection && previousConnection.ssid) {
            log.warn(`Connection to ${ssid} failed. Attempting fallback to previous network: ${previousConnection.ssid}`);
            
            try {
                // Intentar reconectar a la red anterior
                await execPromise(`sudo nmcli connection up "${previousConnection.ssid}"`);
                
                // Esperar a que se establezca la reconexión
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Verificar que la reconexión fue exitosa
                const fallbackStatus = await getConnectionStatus();
                
                if (fallbackStatus.connected && fallbackStatus.ssid === previousConnection.ssid) {
                    log.info(`Successfully restored connection to ${previousConnection.ssid}`);
                    return {
                        success: false,
                        message: `Failed to connect to ${ssid}. Restored previous connection to ${previousConnection.ssid}`,
                        fallbackApplied: true,
                        previousSSID: previousConnection.ssid
                    };
                } else {
                    log.error(`Fallback connection to ${previousConnection.ssid} also failed`);
                    return {
                        success: false,
                        message: `Failed to connect to ${ssid} and could not restore connection to ${previousConnection.ssid}`,
                        fallbackApplied: false
                    };
                }
            } catch (fallbackError) {
                log.error(`Error during fallback to ${previousConnection.ssid}:`, fallbackError);
                return {
                    success: false,
                    message: `Failed to connect to ${ssid} and error during fallback to ${previousConnection.ssid}`,
                    fallbackApplied: false
                };
            }
        } else {
            // No había conexión previa
            return {
                success: false,
                message: `Failed to connect to network ${ssid}: ${error}`
            };
        }
    }
}

/**
 * Obtiene el estado actual de la conexión WiFi
 * @returns Promise con el estado de conexión
 */
export async function getConnectionStatus(): Promise<WiFiConnectionStatus> {
    try {
        log.info('Getting WiFi connection status...');
        // Obtener información de la conexión activa
        const { stdout } = await execPromise(
            'nmcli -t -f GENERAL.DEVICE,GENERAL.TYPE,GENERAL.STATE,GENERAL.CONNECTION,IP4.ADDRESS device show'
        );

        const lines = stdout.trim().split('\n');
        const status: WiFiConnectionStatus = {
            connected: false
        };

        let state = '';
        let connection = '';
        let ipAddress = '';
        let currentInterface = '';
        let deviceType = '';
        let isProcessingWifiDevice = false;

        for (const line of lines) {
            // Detectar cuando empezamos a procesar un nuevo dispositivo
            if (line.startsWith('GENERAL.DEVICE:')) {
                // Si ya teníamos datos de un dispositivo WiFi conectado, procesarlo
                if (isProcessingWifiDevice && deviceType === 'wifi' && state.includes('connected') && connection && connection !== '--' && connection !== 'lo') {
                    status.connected = true;
                    status.ssid = connection;
                    status.interface = currentInterface;
                    if (ipAddress) {
                        status.ipAddress = ipAddress.split('/')[0];
                    }
                    break; // Ya encontramos la conexión WiFi
                }
                
                // Reiniciar para el nuevo dispositivo
                currentInterface = line.split(':')[1];
                state = '';
                connection = '';
                ipAddress = '';
                deviceType = '';
                isProcessingWifiDevice = false;
            }
            
            if (line.startsWith('GENERAL.TYPE:')) {
                deviceType = line.split(':')[1];
                isProcessingWifiDevice = deviceType === 'wifi';
            }
            
            if (line.startsWith('GENERAL.STATE:')) {
                state = line.split(':')[1];
            }
            
            if (line.startsWith('GENERAL.CONNECTION:')) {
                connection = line.split(':')[1];
            }
            
            if (line.startsWith('IP4.ADDRESS[1]:')) {
                ipAddress = line.split(':')[1];
            }
        }

        // Verificar el último dispositivo procesado
        if (isProcessingWifiDevice && deviceType === 'wifi' && state.includes('connected') && connection && connection !== '--' && connection !== 'lo') {
            status.connected = true;
            status.ssid = connection;
            status.interface = currentInterface;
            if (ipAddress) {
                status.ipAddress = ipAddress.split('/')[0];
            }
        }

        log.info(`Current WiFi status: ${JSON.stringify(status)}`);
        return status;

    } catch (error) {
        log.error('Error al obtener el estado de conexión:', error);
        // En caso de error, devolver estado desconectado
        return { connected: false };
    }
}

/**
 * Desconecta de la red WiFi actual
 * @returns Promise que se resuelve cuando la desconexión es exitosa
 */
export async function disconnectFromNetwork(): Promise<void> {
    try {
        log.info('Disconnecting from current WiFi network...');
        const status = await getConnectionStatus();

        if (!status.connected || !status.ssid) {
            throw new Error('No hay ninguna red WiFi conectada');
        }

        // Usar el nombre de la conexión (ssid) para desconectar con sudo
        await execPromise(`sudo nmcli connection down "${status.ssid}"`);
        log.info(`Disconnected from WiFi network: ${status.ssid}`);       

        // Esperar un momento para que la desconexión se complete
        await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
        log.error('Error al desconectar de la red:', error);
        throw new Error(`No se pudo desconectar de la red: ${error}`);
    }
}

/**
 * Elimina una conexión WiFi guardada
 * @param ssid - Nombre de la red WiFi a eliminar
 * @returns Promise que se resuelve cuando la conexión es eliminada
 */
export async function forgetNetwork(ssid: string): Promise<void> {
    try {
        await execPromise(`nmcli connection delete "${ssid}"`);
        log.info(`Forgot WiFi network: ${ssid}`);
    } catch (error) {
        log.error(`Error al eliminar la red ${ssid}:`, error);
        throw new Error(`No se pudo eliminar la red ${ssid}: ${error}`);
    }
}

/**
 * Variables para el monitoreo
 */
let monitoringInterval: NodeJS.Timeout | null = null;
let lastKnownStatus: WiFiConnectionStatus | null = null;
let lastKnownNetworks: WiFiNetwork[] = [];

/**
 * Inicia el monitoreo del estado de conexión WiFi
 * @param intervalMs - Intervalo de verificación en milisegundos (por defecto 5000ms)
 * @param checkNetworks - Si debe monitorear también las redes disponibles (por defecto false)
 */
export function startWiFiMonitoring(
    intervalMs: number = 5000,
    checkNetworks: boolean = false
): void {
    // Si ya hay un monitoreo activo, detenerlo primero
    if (monitoringInterval) {
        log.info('Stopping existing WiFi monitoring before starting a new one...');
        stopWiFiMonitoring();
    }

    log.info('Starting WiFi monitoring...');
    
    // Función para verificar el estado
    const checkStatus = async () => {
        try {
            const currentStatus = await getConnectionStatus();

            // Verificar si hubo cambios en el estado de conexión
            const statusChanged =
                !lastKnownStatus ||
                lastKnownStatus.connected !== currentStatus.connected ||
                lastKnownStatus.ssid !== currentStatus.ssid ||
                lastKnownStatus.ipAddress !== currentStatus.ipAddress;

            if (statusChanged) {
                lastKnownStatus = currentStatus;

                // Emitir evento de cambio de estado
                wifiEventEmitter.emit(wifiEvents.wifiStatusChanged, currentStatus);
            }

            // Verificar también las redes disponibles (siempre, no solo si checkNetworks es true)
            const currentNetworks = await getAvailableNetworks();

            // Verificar si hubo cambios en las redes disponibles
            const networksChanged =
                currentNetworks.length !== lastKnownNetworks.length ||
                !currentNetworks.every((net, idx) =>
                    lastKnownNetworks[idx]?.ssid === net.ssid &&
                    Math.abs(lastKnownNetworks[idx]?.signal - net.signal) <= 5 // Tolerancia de 5% en señal
                );

            if (networksChanged) {
                lastKnownNetworks = currentNetworks;

                // Emitir evento de actualización de redes
                wifiEventEmitter.emit(wifiEvents.wifiNetworksUpdated, currentNetworks);
            }

        } catch (error) {
            console.error('Error en monitoreo WiFi:', error);
            // Emitir evento de error si antes estaba conectado
            if (lastKnownStatus?.connected) {
                const disconnectedStatus: WiFiConnectionStatus = { connected: false };
                lastKnownStatus = disconnectedStatus;
                wifiEventEmitter.emit(wifiEvents.wifiStatusChanged, disconnectedStatus);
            }
        }
    };

    // Ejecutar inmediatamente para obtener el estado inicial
    checkStatus();

    // Configurar el intervalo de verificación
    monitoringInterval = setInterval(checkStatus, intervalMs);
}

/**
 * Detiene el monitoreo del estado de conexión WiFi
 */
export function stopWiFiMonitoring(): void {
    if (monitoringInterval) {
        log.info('Stopping WiFi monitoring...');
        clearInterval(monitoringInterval);
        monitoringInterval = null;
    }
}

/**
 * Verifica si el monitoreo está activo
 * @returns true si el monitoreo está activo, false en caso contrario
 */
export function isMonitoringActive(): boolean {
    return monitoringInterval !== null;
}

/**
 * Obtiene el último estado conocido sin hacer una nueva consulta
 * @returns El último estado conocido o null si no se ha iniciado el monitoreo
 */
export function getLastKnownStatus(): WiFiConnectionStatus | null {
    return lastKnownStatus;
}

/**
 * Obtiene las últimas redes conocidas sin hacer una nueva consulta
 * @returns Las últimas redes conocidas
 */
export function getLastKnownNetworks(): WiFiNetwork[] {
    return lastKnownNetworks;
}


export default {
    getAvailableNetworks,
    connectToNetwork,
    getConnectionStatus,
    disconnectFromNetwork,
    forgetNetwork,
    startWiFiMonitoring,
    stopWiFiMonitoring,
    isMonitoringActive,
    getLastKnownStatus,
    getLastKnownNetworks
};