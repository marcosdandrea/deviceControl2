import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Log } from '@src/utils/log.js';

const execAsync = promisify(exec);

const BACKLIGHT_DIR = '/sys/class/backlight/pwm-backlight';
const BRIGHTNESS_FILE = `${BACKLIGHT_DIR}/brightness`;
const MAX_BRIGHTNESS_FILE = `${BACKLIGHT_DIR}/max_brightness`;
const TRANSITION_STEP_MS = 20;
// Función PWM (PWM0_CHAN2) del pin GPIO18, tal como lo definen los overlays de Chipsee
// (dtoverlay=pwm-backlight,pin=18,func=2,pwm_2). Si algo externo al margen de esta app
// reconfigura el pin como GPIO simple (p. ej. un script de arranque desactualizado), el
// backlight deja de responder aunque los comandos a sysfs "funcionen" sin error.
const BACKLIGHT_PIN_PWM_FUNC = 'a3';

export class ScreenController {
    private static instance: ScreenController;
    private log = Log.createInstance('ScreenController', true);
    private lastBrightness: number | null = null;
    private transitionTimer: NodeJS.Timeout | null = null;
    // Se incrementa en cada transitionTo(). Un tick de un temporizador anterior (por ejemplo,
    // una escritura async todavía en vuelo cuando llega un nuevo pedido de brillo) compara su
    // propia generación contra esta antes de escribir o resolver: si ya no coincide, se
    // considera superado y no debe tocar el sysfs ni pisar el resultado de la transición nueva.
    private transitionGeneration = 0;

    private constructor() { }

    public static getInstance(): ScreenController {
        if (!ScreenController.instance) {
            ScreenController.instance = new ScreenController();
        }
        return ScreenController.instance;
    }

    // Corrige el pin del backlight a su función PWM por si algo externo a la app (p. ej.
    // un script de arranque desactualizado) lo dejó en modo GPIO simple. Se llama una vez
    // al iniciar la app. No es fatal si falla (por ejemplo, en un entorno de desarrollo sin
    // este hardware): solo se registra una advertencia.
    async ensureBacklightPinMode(): Promise<void> {
        try {
            await execAsync(`sudo pinctrl set 18 ${BACKLIGHT_PIN_PWM_FUNC}`);
            this.log.info('Pin del backlight (GPIO18) verificado en modo PWM');
        } catch (error) {
            this.log.warn(`No se pudo verificar/corregir el modo PWM del pin del backlight: ${error}`);
        }
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
        const myGeneration = ++this.transitionGeneration;

        if (this.transitionTimer) {
            clearInterval(this.transitionTimer);
            this.transitionTimer = null;
        }

        const startRaw = await this.readBrightness();
        // Mientras leíamos el brillo actual, otra llamada a transitionTo pudo haber empezado
        // (readBrightness es async): si ya no somos la última, ceder sin escribir ni resolver
        // como error, para no pisar a la transición más nueva.
        if (myGeneration !== this.transitionGeneration) return;
        if (startRaw === targetRaw) return;

        const transitionMs = Number(process.env.SCREEN_BRIGHTNESS_TRANSITION_MS) || 700;
        const totalSteps = Math.max(1, Math.round(transitionMs / TRANSITION_STEP_MS));

        return new Promise((resolve, reject) => {
            let step = 0;
            const timer = setInterval(async () => {
                // Una transición más nueva tomó el control: esta invocación quedó huérfana.
                // No escribir (evitaría pisar el valor correcto) y terminar en silencio.
                if (myGeneration !== this.transitionGeneration) {
                    clearInterval(timer);
                    resolve();
                    return;
                }

                step += 1;
                const progress = step / totalSteps;
                const value = Math.round(startRaw + (targetRaw - startRaw) * progress);
                try {
                    await fs.writeFile(BRIGHTNESS_FILE, String(value));
                } catch (error) {
                    clearInterval(timer);
                    if (myGeneration === this.transitionGeneration) {
                        this.transitionTimer = null;
                    }
                    reject(error);
                    return;
                }

                // Chequear de nuevo tras el await: pudo haber llegado una transición nueva
                // mientras se escribía.
                if (myGeneration !== this.transitionGeneration) {
                    clearInterval(timer);
                    resolve();
                    return;
                }

                if (step >= totalSteps) {
                    clearInterval(timer);
                    this.transitionTimer = null;
                    resolve();
                }
            }, TRANSITION_STEP_MS);
            this.transitionTimer = timer;
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
