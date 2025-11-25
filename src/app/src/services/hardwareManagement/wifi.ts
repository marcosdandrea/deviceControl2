import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import wifiEvents from '@common/events/wifi.events';
import { WiFiConnectionStatus, WiFiNetwork } from '@common/types/wifi.types';
import { Log } from '@src/utils/log';

const log = Log.createInstance('WiFi Service', false);

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
        // Escanear redes disponibles usando nmcli
        const { stdout } = await execPromise(
            'nmcli -t -f SSID,SIGNAL,SECURITY,IN-USE device wifi list'
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

/**
 * Conecta a una red WiFi específica
 * @param ssid - Nombre de la red WiFi
 * @param password - Contraseña de la red (opcional para redes abiertas)
 * @returns Promise que se resuelve cuando la conexión es exitosa
 */
export async function connectToNetwork(
    ssid: string,
    password?: string
): Promise<void> {
    try {
        log.info(`Connecting to WiFi network: ${ssid}`);
        // Verificar si ya existe una conexión guardada con este SSID
        let connectionExists = false;
        try {
            const { stdout } = await execPromise(
                `nmcli -t -f NAME connection show`
            );
            connectionExists = stdout.includes(ssid);
        } catch (error) {
            // Si hay error, asumimos que no existe
            connectionExists = false;
        }

        if (connectionExists) {
            // Si la conexión ya existe, intentar conectar
            await execPromise(`nmcli connection up "${ssid}"`);
        } else {
            // Si no existe, crear nueva conexión
            if (password) {
                await execPromise(
                    `nmcli device wifi connect "${ssid}" password "${password}"`
                );
            } else {
                await execPromise(`nmcli device wifi connect "${ssid}"`);
            }
        }

        // Esperar un momento para que la conexión se establezca
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verificar que la conexión fue exitosa
        const status = await getConnectionStatus();
        log.info(`Connection status: ${JSON.stringify(status)}`);

        if (!status.connected || status.ssid !== ssid) {
            throw new Error('La conexión no se pudo establecer correctamente');
        }

    } catch (error) {
        log.error(`Error al conectar a la red ${ssid}:`, error);
        throw new Error(
            `No se pudo conectar a la red ${ssid}: ${error}`
        );
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
            'nmcli -t -f GENERAL.STATE,GENERAL.CONNECTION,IP4.ADDRESS,SIGNAL device show'
        );

        const lines = stdout.trim().split('\n');
        const status: WiFiConnectionStatus = {
            connected: false
        };

        let state = '';
        let connection = '';
        let ipAddress = '';
        let signal = '';
        let currentInterface = '';

        for (const line of lines) {
            if (line.startsWith('GENERAL.DEVICE:')) {
                currentInterface = line.split(':')[1];
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
            if (line.startsWith('SIGNAL:')) {
                signal = line.split(':')[1];
            }
        }

        // Verificar si hay una conexión WiFi activa
        if (state && state.includes('connected') && connection && connection !== '--') {
            status.connected = true;
            status.ssid = connection;
            status.interface = currentInterface;

            if (ipAddress) {
                // Extraer solo la IP sin la máscara
                status.ipAddress = ipAddress.split('/')[0];
            }

            if (signal) {
                status.signal = parseInt(signal);
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

        await execPromise(`nmcli connection down "${status.ssid}"`);
        log.info(`Disconnected from WiFi network: ${status.ssid}`);

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

            // Si se solicita, verificar también las redes disponibles
            if (checkNetworks) {
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