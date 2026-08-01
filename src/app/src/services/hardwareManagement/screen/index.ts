import { promises as fs } from 'fs';
import { Log } from '@src/utils/log.js';

const BACKLIGHT_DIR = '/sys/class/backlight/pwm-backlight';
const BRIGHTNESS_FILE = `${BACKLIGHT_DIR}/brightness`;
const MAX_BRIGHTNESS_FILE = `${BACKLIGHT_DIR}/max_brightness`;
const TRANSITION_STEP_MS = 20;

export class ScreenController {
    private static instance: ScreenController;
    private log = Log.createInstance('ScreenController', true);
    private lastBrightness: number | null = null;
    private transitionTimer: NodeJS.Timeout | null = null;

    private constructor() { }

    public static getInstance(): ScreenController {
        if (!ScreenController.instance) {
            ScreenController.instance = new ScreenController();
        }
        return ScreenController.instance;
    }

    private async readBrightness(): Promise<number> {
        const raw = await fs.readFile(BRIGHTNESS_FILE, 'utf-8');
        return parseInt(raw.trim(), 10);
    }

    private async readMaxBrightness(): Promise<number> {
        const raw = await fs.readFile(MAX_BRIGHTNESS_FILE, 'utf-8');
        return parseInt(raw.trim(), 10);
    }

    private async percentageToRaw(percentage: number): Promise<number> {
        const max = await this.readMaxBrightness();
        const clamped = Math.max(1, Math.min(100, Math.round(percentage)));
        return Math.round((clamped / 100) * max);
    }

    // Interpola el brillo desde el valor actual hasta targetRaw a lo largo de
    // SCREEN_BRIGHTNESS_TRANSITION_MS (por defecto 700ms). Cancela cualquier transición
    // en curso, para que ajustes seguidos (p. ej. arrastrando el slider) no se pisen entre sí.
    private async transitionTo(targetRaw: number): Promise<void> {
        if (this.transitionTimer) {
            clearInterval(this.transitionTimer);
            this.transitionTimer = null;
        }

        const startRaw = await this.readBrightness();
        if (startRaw === targetRaw) return;

        const transitionMs = Number(process.env.SCREEN_BRIGHTNESS_TRANSITION_MS) || 700;
        const totalSteps = Math.max(1, Math.round(transitionMs / TRANSITION_STEP_MS));

        return new Promise((resolve, reject) => {
            let step = 0;
            this.transitionTimer = setInterval(async () => {
                step += 1;
                const progress = step / totalSteps;
                const value = Math.round(startRaw + (targetRaw - startRaw) * progress);
                try {
                    await fs.writeFile(BRIGHTNESS_FILE, String(value));
                } catch (error) {
                    if (this.transitionTimer) {
                        clearInterval(this.transitionTimer);
                        this.transitionTimer = null;
                    }
                    reject(error);
                    return;
                }
                if (step >= totalSteps) {
                    if (this.transitionTimer) {
                        clearInterval(this.transitionTimer);
                        this.transitionTimer = null;
                    }
                    resolve();
                }
            }, TRANSITION_STEP_MS);
        });
    }

    // targetPercentage: brillo deseado (1-100) al encender. Si no se especifica, usa el
    // último brillo conocido (por ejemplo, el que tenía antes de apagarse), o el máximo
    // del panel si nunca se registró uno.
    async turnOn(targetPercentage?: number): Promise<void> {
        try {
            const target = targetPercentage != null
                ? await this.percentageToRaw(targetPercentage)
                : this.lastBrightness ?? await this.readMaxBrightness();
            this.lastBrightness = target;
            await this.transitionTo(target);
            this.log.info(`Pantalla encendida (brightness=${target})`);
        } catch (error) {
            throw new Error(`Error al encender la pantalla: ${error}`);
        }
    }

    async turnOff(): Promise<void> {
        try {
            const current = await this.readBrightness();
            if (current > 0) {
                this.lastBrightness = current;
            }
            await this.transitionTo(0);
            this.log.info('Pantalla apagada');
        } catch (error) {
            throw new Error(`Error al apagar la pantalla: ${error}`);
        }
    }

    // Ajusta el brillo configurado (1-100%). Si la pantalla está actualmente apagada
    // (brightness=0), no la reenciende: solo queda registrado para el próximo turnOn().
    async setBrightness(percentage: number): Promise<void> {
        try {
            const raw = await this.percentageToRaw(percentage);
            const current = await this.readBrightness();
            this.lastBrightness = raw;
            if (current > 0) {
                await this.transitionTo(raw);
            }
            this.log.info(`Brillo configurado a ${percentage}% (brightness=${raw})`);
        } catch (error) {
            throw new Error(`Error al ajustar el brillo: ${error}`);
        }
    }
}
