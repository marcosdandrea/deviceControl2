/**
 * Interface para representar una red WiFi detectada
 */
export interface WiFiNetwork {
    ssid: string;
    signal: number; // Fuerza de señal en porcentaje (0-100)
    security: string; // Tipo de seguridad (WPA, WPA2, Open, etc.)
    inUse: boolean; // Si es la red actualmente conectada
}

/**
 * Interface para el estado de conexión WiFi
 */
export interface WiFiConnectionStatus {
    connected: boolean;
    ssid?: string;
    interface?: string;
    ipAddress?: string;
    signal?: number;
}