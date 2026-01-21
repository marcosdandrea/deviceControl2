import { LocalizationManagerInterface, TimezoneInfo } from "@common/types/localization.type";
import { EventEmitter } from "events";
import { ChildProcess, spawn } from 'child_process';
import { Log } from '@src/utils/log';
import { broadcastToClients } from "@src/services/ipcServices/index.js";
import LocalizationEvents from "@common/events/localization.events";

const log = Log.createInstance('Localization Manager', false);

/**
 * Clase singleton para el manejo de localización y zona horaria del sistema
 * 
 * Competencias:
 * - Obtener la información actual de zona horaria
 * - Establecer una nueva zona horaria
 * - Listar zonas horarias disponibles
 * - Validar zonas horarias
 * - Emitir eventos sobre cambios de zona horaria
 */
export class LocalizationManager extends EventEmitter implements LocalizationManagerInterface {
    private static _instance: LocalizationManager;
    private log: Log;

    private constructor() {
        super();
        this.log = Log.createInstance('LocalizationManager', false);
    }

    static getInstance(): LocalizationManager {
        if (!LocalizationManager._instance) {
            LocalizationManager._instance = new LocalizationManager();
        }
        return LocalizationManager._instance;
    }

    /**
     * Obtiene la información actual de zona horaria del sistema
     */
    async getCurrentTimezone(): Promise<TimezoneInfo> {
        return new Promise((resolve, reject) => {
            const process = spawn('timedatectl', ['status']);
            let output = '';

            process.stdout.on('data', (data: Buffer) => {
                output += data.toString();
            });

            process.stderr.on('data', (data: Buffer) => {
                this.log.error('Error getting timezone info:', data.toString());
            });

            process.on('close', (code: number) => {
                if (code !== 0) {
                    const error = `timedatectl exited with code ${code}`;
                    this.log.error(error);
                    reject(new Error(error));
                    return;
                }

                try {
                    const info = this.parseTimedatectlOutput(output);
                    resolve(info);
                } catch (error) {
                    this.log.error('Error parsing timezone info:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Establece una nueva zona horaria en el sistema
     */
    async setTimezone(timezone: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                // Primero validamos que la zona horaria existe
                const isValid = await this.validateTimezone(timezone);
                if (!isValid) {
                    const error = `Invalid timezone: ${timezone}`;
                    this.log.error(error);
                    reject(new Error(error));
                    return;
                }

                this.log.info(`Setting timezone to: ${timezone}`);
                
                const process = spawn('sudo', ['timedatectl', 'set-timezone', timezone]);
                let errorOutput = '';

                process.stderr.on('data', (data: Buffer) => {
                    errorOutput += data.toString();
                });

                process.on('close', async (code: number) => {
                    if (code !== 0) {
                        const error = `Failed to set timezone: ${errorOutput}`;
                        this.log.error(error);
                        this.emit(LocalizationEvents.timezoneChangeError, { timezone, error });
                        broadcastToClients('localizationError', { timezone, error });
                        reject(new Error(error));
                        return;
                    }

                    this.log.info(`Timezone successfully changed to: ${timezone}`);
                    
                    // Emitir evento de cambio exitoso
                    this.emit(LocalizationEvents.timezoneChanged, { timezone });
                    broadcastToClients('timezoneChanged', { timezone });
                    
                    resolve(true);
                });
            } catch (error) {
                this.log.error('Error setting timezone:', error);
                reject(error);
            }
        });
    }

    /**
     * Lista todas las zonas horarias disponibles
     */
    async listAvailableTimezones(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const process = spawn('timedatectl', ['list-timezones']);
            let output = '';

            process.stdout.on('data', (data: Buffer) => {
                output += data.toString();
            });

            process.stderr.on('data', (data: Buffer) => {
                this.log.error('Error listing timezones:', data.toString());
            });

            process.on('close', (code: number) => {
                if (code !== 0) {
                    const error = `timedatectl list-timezones exited with code ${code}`;
                    this.log.error(error);
                    reject(new Error(error));
                    return;
                }

                try {
                    const timezones = output
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0)
                        .sort();
                    
                    resolve(timezones);
                } catch (error) {
                    this.log.error('Error parsing timezone list:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Valida si una zona horaria es válida
     */
    async validateTimezone(timezone: string): Promise<boolean> {
        try {
            const availableTimezones = await this.listAvailableTimezones();
            return availableTimezones.includes(timezone);
        } catch (error) {
            this.log.error('Error validating timezone:', error);
            return false;
        }
    }

    /**
     * Parsea la salida de timedatectl status
     */
    private parseTimedatectlOutput(output: string): TimezoneInfo {
        const lines = output.split('\n');
        const info: Partial<TimezoneInfo> = {};

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('Local time:')) {
                info.localTime = trimmedLine.replace('Local time:', '').trim();
            } else if (trimmedLine.startsWith('Universal time:')) {
                info.universalTime = trimmedLine.replace('Universal time:', '').trim();
            } else if (trimmedLine.startsWith('RTC time:')) {
                info.rtcTime = trimmedLine.replace('RTC time:', '').trim();
            } else if (trimmedLine.startsWith('Time zone:')) {
                const timezoneMatch = trimmedLine.match(/Time zone: ([^(]+)/);
                if (timezoneMatch) {
                    info.timezone = timezoneMatch[1].trim();
                }
                const offsetMatch = trimmedLine.match(/\(([^,]+)/);
                if (offsetMatch) {
                    info.offset = offsetMatch[1].trim();
                }
            } else if (trimmedLine.startsWith('System clock synchronized:')) {
                info.systemClockSynchronized = trimmedLine.includes('yes');
            } else if (trimmedLine.startsWith('NTP service:')) {
                info.ntpService = trimmedLine.replace('NTP service:', '').trim();
            }
        }

        // Validar que tenemos la información esencial
        if (!info.timezone || !info.localTime || !info.universalTime) {
            throw new Error('Unable to parse timezone information from timedatectl output');
        }

        return info as TimezoneInfo;
    }
}

export default LocalizationManager;
