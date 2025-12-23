import { exec } from 'child_process';
import { promisify } from 'util';
import { Log } from '@src/utils/log';

const log = Log.createInstance('Hardware Management Utils', false);

const execPromise = promisify(exec);

/**
 * Verifica si un comando está disponible en el sistema
 */
async function isCommandAvailable(command: string): Promise<boolean> {
    try {
        await execPromise(`which ${command}`);
        log.info(`Command "${command}" is available.`);
        return true;
    } catch {
        log.warn(`Command "${command}" is not available.`);
        return false;
    }
}

/**
 * Verifica si el hardware es propietario chequeando la disponibilidad
 * de todos los comandos necesarios del sistema operativo
 */
export async function isPropietaryHardware(): Promise<boolean> {
    log.info("Checking if hardware is proprietary...");
    const requiredCommands = ['nmcli', 'sudo'];
    
    try {
        const results = await Promise.all(
            requiredCommands.map(cmd => isCommandAvailable(cmd))
        );
        
        // Todos los comandos deben estar disponibles
        return results.every(available => available);
    } catch {
        return false;
    }
}