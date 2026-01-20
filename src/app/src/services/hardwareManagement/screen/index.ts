import { exec } from 'child_process';
import { promisify } from 'util';
import { Log } from '@src/utils/log.js';

const execAsync = promisify(exec);

export class ScreenController {
    private readonly requiredCommands = ['pinctrl'];
    private isCompatible = false;
    private log = Log.createInstance('ScreenController', true);

    constructor() {
        this.checkCompatibility();
    }

    private async checkCompatibility(): Promise<void> {
        try {
            for (const command of this.requiredCommands) {
                await execAsync(`which ${command}`);
            }
            this.isCompatible = true;
        } catch (error) {
            this.isCompatible = false;
            this.log.error('Sistema no compatible: comandos requeridos no encontrados', {
                commands: this.requiredCommands,
                error: error
            });
        }
    }

    async turnOn(): Promise<void> {
        if (!this.isCompatible) {
            throw new Error('Sistema no compatible. No se pueden ejecutar los comandos requeridos.');
        }

        try {
            await execAsync('pinctrl set 18 op dh');
            this.log.info('Pantalla encendida');
        } catch (error) {
            throw new Error(`Error al encender la pantalla: ${error}`);
        }
    }

    async turnOff(): Promise<void> {
        if (!this.isCompatible) {
            throw new Error('Sistema no compatible. No se pueden ejecutar los comandos requeridos.');
        }

        try {
            await execAsync('pinctrl set 18 op dl');
            this.log.info('Pantalla apagada');
        } catch (error) {
            throw new Error(`Error al apagar la pantalla: ${error}`);
        }
    }
}