import { exec } from 'child_process';
import { promisify } from 'util';
import { Log } from '@src/utils/log.js';

const execAsync = promisify(exec);

export class ScreenController {
    private static instance: ScreenController;
    private readonly requiredCommands = ['pinctrl'];
    private compatibilityPromise: Promise<boolean>;
    private log = Log.createInstance('ScreenController', true);

    private constructor() {
        this.compatibilityPromise = this.checkCompatibility();
    }

    public static getInstance(): ScreenController {
        if (!ScreenController.instance) {
            ScreenController.instance = new ScreenController();
        }
        return ScreenController.instance;
    }

    private async checkCompatibility(): Promise<boolean> {
        try {
            // Verificar que pinctrl existe
            await execAsync('which pinctrl');
            
            // Verificar que podemos ejecutar sudo pinctrl sin contraseña
            await execAsync('sudo -n pinctrl help > /dev/null 2>&1');
            
            this.log.info('Sistema compatible: pinctrl disponible con permisos sudo', {
                commands: this.requiredCommands
            });
            return true;
        } catch (error) {
            this.log.error('Sistema no compatible: pinctrl no disponible o sin permisos sudo', {
                commands: this.requiredCommands,
                error: error
            });
            return false;
        }
    }

    async turnOn(): Promise<void> {
        const isCompatible = await this.compatibilityPromise;
        
        if (!isCompatible) {
            throw new Error('Sistema no compatible. No se pueden ejecutar los comandos requeridos.');
        }

        try {
            await execAsync('sudo pinctrl set 18 op dh');
            this.log.info('Pantalla encendida');
        } catch (error) {
            throw new Error(`Error al encender la pantalla: ${error}`);
        }
    }

    async turnOff(): Promise<void> {
        const isCompatible = await this.compatibilityPromise;
        
        if (!isCompatible) {
            throw new Error('Sistema no compatible. No se pueden ejecutar los comandos requeridos.');
        }

        try {
            await execAsync('sudo pinctrl set 18 op dl');
            this.log.info('Pantalla apagada');
        } catch (error) {
            throw new Error(`Error al apagar la pantalla: ${error}`);
        }
    }
}