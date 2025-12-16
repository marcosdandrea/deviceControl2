import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";
import { Context } from "@src/domain/entities/context";
import dictionary from "@common/i18n";
import { Project } from "@src/domain/entities/project";

interface AutoCheckRoutineConditionsJobParams extends JobType {
    params: {
        interval: number;
        routineId: string;
    };
}

export class AutoCheckRoutineConditionsJob extends Job {
    static description = "Activa o desactiva el chequeo automático de condiciones en las rutinas seleccionadas.";
    static name = "Auto-chequeo de condiciones";
    static type = jobTypes.autoCheckRoutineConditionsJob;

    constructor(options: AutoCheckRoutineConditionsJobParams) {
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: false,
            type: jobTypes.autoCheckRoutineConditionsJob,
        });

        this.validateParams();
    }

    requiredParams(): requiredJobParamType[] {
        return [
            {
                name: "interval",
                type: "number",
                validationMask: "^(0|[5-9]\\d{3,}|[1-9]\\d{4,})$",
                description: "Intervalo en ms para el chequeo automático (0 para deshabilitar, >= 5000 para habilitar)",
                required: true,
                defaultValue: 0
            },
            {
                name: "routineId",
                type: "select",
                description: "Rutina a la que se aplicará la configuración",
                required: true,
                options: [] // Se llenará dinámicamente desde el proyecto
            }
        ];
    }

    async job({ ctx, abortSignal }: { ctx: Context; abortSignal: AbortSignal }): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const displayName = this.getDisplayName();

            if (ctx == null)
                return reject(new Error(dictionary("app.domain.entities.job.contextRequired", displayName)));

            if (abortSignal == null)
                return reject(new Error(dictionary("app.domain.entities.job.abortSignalRequired", displayName)));

            const { interval, routineId } = this.params;

            // Validar intervalo
            if (typeof interval !== "number") {
                ctx.log.error(`${displayName}: El intervalo debe ser un número`);
                this.failed = true;
                this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: "El intervalo debe ser un número" });
                return reject(new Error(`${displayName}: El intervalo debe ser un número`));
            }

            // Validar que el intervalo sea 0 o >= 5000
            if (interval !== 0 && interval < 5000) {
                ctx.log.error(`${displayName}: El intervalo debe ser 0 (deshabilitar) o mayor o igual a 5000 ms`);
                this.failed = true;
                this.dispatchEvent(jobEvents.jobError, { 
                    jobId: this.id, 
                    error: "El intervalo debe ser 0 (deshabilitar) o mayor o igual a 5000 ms" 
                });
                return reject(new Error(`${displayName}: El intervalo debe ser 0 (deshabilitar) o mayor o igual a 5000 ms`));
            }

            // Validar rutina
            if (!routineId || typeof routineId !== 'string') {
                ctx.log.error(`${displayName}: Debe seleccionar una rutina`);
                this.failed = true;
                this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: "Debe seleccionar una rutina" });
                return reject(new Error(`${displayName}: Debe seleccionar una rutina`));
            }

            this.failed = false;
            this.dispatchEvent(jobEvents.jobRunning, { jobId: this.id });

            try {
                // Obtener el proyecto actual
                const project = Project.getInstance();
                if (!project) {
                    throw new Error("No hay un proyecto cargado");
                }

                // Buscar la rutina seleccionada
                const routine = project.routines.find(r => r.id === routineId);
                
                if (!routine) {
                    throw new Error(`La rutina con ID "${routineId}" no fue encontrada`);
                }

                // Detener el chequeo automático actual si existe
                if (routine.autoCheckConditionEveryMs !== false) {
                    routine.stopAutoCheckingConditions();
                }

                // Configurar el nuevo intervalo
                if (interval === 0) {
                    routine.autoCheckConditionEveryMs = false;
                    ctx.log.info(`${displayName}: Chequeo automático deshabilitado para la rutina "${routine.name}"`);
                } else {
                    routine.autoCheckConditionEveryMs = interval;
                    // Iniciar el chequeo automático si la rutina está habilitada
                    if (routine.enabled) {
                        // El chequeo se iniciará automáticamente por el evento routineEnabled
                        routine.emit('routine:enabled');
                    }
                    ctx.log.info(`${displayName}: Chequeo automático configurado a ${interval}ms para la rutina "${routine.name}"`);
                }

                const action = interval === 0 ? "deshabilitado" : `configurado a ${interval}ms`;
                ctx.log.info(`${displayName}: Chequeo automático ${action} para la rutina "${routine.name}"`);

                this.dispatchEvent(jobEvents.jobFinished, { 
                    jobId: this.id, 
                    routineId: routine.id,
                    routineName: routine.name
                });
                resolve();

            } catch (error) {
                ctx.log.error(`${displayName}: Error al configurar el chequeo automático: ${error.message}`);
                this.failed = true;
                this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: error.message });
                reject(error);
            }
        });
    }
}

export default AutoCheckRoutineConditionsJob;
