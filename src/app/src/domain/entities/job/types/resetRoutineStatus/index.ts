import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";
import { Context } from "@src/domain/entities/context";
import dictionary from "@common/i18n";
import { Project } from "@src/domain/entities/project";

interface ResetRoutineStatusJobParams extends JobType {
    params: {
        routineId: string;
    };
}

export class ResetRoutineStatusJob extends Job {
    static description = "Restablece el estado de una rutina a 'Desconocido'.";
    static name = "Restablecer Estado de Rutina";
    static type = jobTypes.resetRoutineStatusJob;

    constructor(options: ResetRoutineStatusJobParams) {
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: false,
            type: jobTypes.resetRoutineStatusJob,
        });

        this.validateParams();
    }

    requiredParams(): requiredJobParamType[] {
        return [
            {
                name: "routineId",
                type: "select",
                description: "Rutina cuyo estado será restablecido a 'Desconocido'",
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

            const { routineId } = this.params;

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

                // Restablecer el estado de la rutina a "unknown" usando el método público
                // Esto automáticamente despachará el evento correspondiente
                if (!routine.setStatus("unknown")){
                    console.log ("No se pudo restablecer el estado de la rutina", routineId, routine.name);
                }

                this.log.info(ctx.log.info(`${displayName}: Estado de la rutina "${routine.name}" restablecido a "Desconocido"`))

                this.dispatchEvent(jobEvents.jobFinished, { 
                    jobId: this.id, 
                    routineId: routine.id,
                    routineName: routine.name
                });
                resolve();

            } catch (error) {
                ctx.log.error(`${displayName}: Error al restablecer el estado de la rutina: ${error.message}`);
                this.failed = true;
                this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: error.message });
                reject(error);
            }
        });
    }
}

export default ResetRoutineStatusJob;
