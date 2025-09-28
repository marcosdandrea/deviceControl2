const LANG = String(process.env.DEFAULT_LANGUAGE || "es");

export const dictionary = (key: string, ...params: Array<string | number>): string => {
    const translationsForLang = translations[LANG] ?? translations.es;
    let translation = translationsForLang[key] || key;
    if (params.length > 0) {
        params.forEach((param, index) => {
            translation = translation.replace(`{${index + 1}}`, String(param));
        });
    }
    return translation;
};

const translations: { [key: string]: { [key: string]: string } } = {
    es: {
        "app.domain.entities.job.executed": "Se ejecutó el trabajo '{1}'",
        "app.domain.entities.job.aborted": "La ejecución del trabajo '{1}' fue abortada.",
        "app.domain.entities.job.abortedByUser": "La ejecución del trabajo '{1}' fue abortada por el usuario.",
        "app.domain.entities.job.failed": "La ejecución del trabajo falló: {1}",
        "app.domain.entities.job.finished": "La ejecución del trabajo ha finalizado exitosamente en {1} ms.",

        "app.domain.entities.job.wait.invalidTimeParameter": "Parámetro 'time' inválido para el trabajo '{1}': {2}",
        "app.domain.entities.job.contextRequired": "Se requiere un contexto para ejecutar el trabajo '{1}'",
        "app.domain.entities.job.abortSignalRequired": "Se requiere un AbortSignal para ejecutar el trabajo '{1}'",
        "app.domain.entities.job.wait.aborted": "Se abortó el trabajo '{1}'",
        "app.domain.entities.job.wait.completed": "El trabajo '{1}' se completó correctamente",

        "app.domain.entities.job.sendUdp.starting": "Iniciando el trabajo '{1}'",
        "app.domain.entities.job.sendUdp.sendingToBroadcast": "Enviando paquete UDP a la dirección de broadcast {1}:{2}",
        "app.domain.entities.job.sendUdp.failed": "Error al enviar el paquete UDP: {1}",
        "app.domain.entities.job.sendUdp.sent": "Paquete UDP '{1}' enviado a {2}:{3}",
        "app.domain.entities.job.sendUdp.finished": "El trabajo '{1}' ha finalizado",

        "app.domain.entities.job.sendTcp.failed": "Error al enviar el paquete TCP: {1}",
        "app.domain.entities.job.sendTcp.sent": "Paquete TCP enviado a {1}:{2}",

        "app.domain.entities.job.wakeOnLan.starting": "Iniciando el trabajo '{1}'",
        "app.domain.entities.job.wakeOnLan.failed": "Error al enviar el paquete UDP: {1}",
        "app.domain.entities.job.wakeOnLan.sent": "Paquete UDP para despertar el dispositivo con MAC '{1}' enviado al puerto {2}",
        "app.domain.entities.job.wakeOnLan.finished": "El trabajo '{1}' ha finalizado",

        "app.domain.entities.job.sendPjLink.starting": "Iniciando comando PJLink {1} hacia {2}",
        "app.domain.entities.job.sendPjLink.completed": "Comando PJLink completado correctamente en {1}",
        "app.domain.entities.job.sendPjLink.unknownCommand": "Comando PJLink desconocido: {1}",
        "app.domain.entities.job.sendPjLink.timeout": "Tiempo de espera agotado al comunicarse con el dispositivo PJLink",
        "app.domain.entities.job.sendPjLink.authRequired": "El dispositivo requiere autenticación PJLink",

        "app.domain.entities.trigger.activated": "El disparador '{1}' se activó",
        "app.domain.entities.trigger.disarmed": "El disparador '{1}' se desarmó",
        "app.domain.entities.trigger.rearmed": "El disparador '{1}' se rearma automáticamente",

        "app.domain.entities.condition.evaluationSucceeded": "La evaluación de la condición '{1}' fue exitosa",
        "app.domain.entities.condition.evaluationFailed": "Error durante la evaluación de la condición '{1}': {2}",
        "app.domain.entities.condition.pingFailed": "La verificación de la condición '{1}' falló: destino inaccesible",
        "app.domain.entities.condition.pjlinkUnknownStatus": "Estado PJLink desconocido: {1}",
        "app.domain.entities.condition.pjlinkTimeout": "Tiempo de espera agotado al consultar el dispositivo PJLink",
        "app.domain.entities.condition.pjlinkAuthRequired": "El dispositivo PJLink requiere autenticación",
        "app.domain.entities.condition.pjlinkErrorResponse": "Respuesta de error del dispositivo PJLink: {1}",

        "app.domain.entities.routine.notEnabled": "La rutina '{1}' no está habilitada",
        "app.domain.entities.routine.invalidTrigger": "La rutina '{1}' no tiene un disparador válido",
        "app.domain.entities.routine.alreadyRunning": "La rutina '{1}' ya se está ejecutando",
        "app.domain.entities.routine.invalidContext": "Se proporcionó un contexto inválido para la rutina '{1}'",
        "app.domain.entities.routine.autoCheckingConditions": "Autoverificando condiciones para {1} tareas",
        "app.domain.entities.routine.checkingConditionForTask": "Verificando condición para la tarea '{1}'",
        "app.domain.entities.routine.started": "La rutina '{1}' inició",
        "app.domain.entities.routine.runningTasksInSync": "Ejecutando tareas en secuencia...",
        "app.domain.entities.routine.runningTask": "Ejecutando la tarea '{1}'...",
        "app.domain.entities.routine.taskCompleted": "La tarea '{1}' finalizó",
        "app.domain.entities.routine.taskAborted": "La tarea '{1}' fue abortada: {2}",
        "app.domain.entities.routine.taskFailed": "La tarea '{1}' falló: {2}",
        "app.domain.entities.routine.runningTasksInParallelBreak": "Ejecutando tareas en paralelo sin 'continuar en error'...",
        "app.domain.entities.routine.tasksCompletedWithResult": "Tareas completadas: {1}",
        "app.domain.entities.routine.tasksAborted": "Tareas abortadas: {1}",
        "app.domain.entities.routine.runningTasksInParallelContinue": "Ejecutando tareas en paralelo con 'continuar en error'...",
        "app.domain.entities.routine.tasksCompletedList": "Tareas completadas: {1}",
        "app.domain.entities.routine.taskFailedReason": "La tarea falló: {1}",
        "app.domain.entities.routine.taskFulfilledValue": "La tarea completó: {1}",
        "app.domain.entities.routine.completed": "La rutina finalizó correctamente en {1} ms",
        "app.domain.entities.routine.aborted": "La rutina fue abortada: {1}",
        "app.domain.entities.routine.timedOut": "La rutina alcanzó el tiempo máximo: {1}",
        "app.domain.entities.routine.failed": "La rutina finalizó con errores: {1}",
        "app.domain.entities.routine.breakOnErrorDisabled": "La tarea falló. Se detiene la ejecución porque 'continuar en error' está deshabilitado.",
        "app.domain.entities.routine.tasksFailedDetails": "Algunas tareas fallaron. Verifica los registros para más detalles.",
        "app.domain.entities.routine.abortSignal": "Señal de aborto recibida",

        "app.domain.entities.task.starting": "Iniciando la tarea '{1}'",
        "app.domain.entities.task.aborted": "La tarea '{1}' fue abortada",
        "app.domain.entities.task.timedOut": "La tarea '{1}' excedió el tiempo máximo",
        "app.domain.entities.task.failed": "La tarea '{1}' falló: {2}",
        "app.domain.entities.task.completed": "La tarea '{1}' finalizó correctamente en {2} ms",
        "app.domain.entities.task.conditionMet": "La condición de la tarea '{1}' se cumplió, finalizando ejecución",
        "app.domain.entities.task.checkingConditionBefore": "Verificando condición antes de ejecutar la tarea '{1}'",
        "app.domain.entities.task.executingJobAttempt": "Ejecutando el trabajo de la tarea '{1}', intento {2} de {3}",
        "app.domain.entities.task.noCondition": "La tarea '{1}' no tiene condición, finalizando ejecución",
        "app.domain.entities.task.conditionNotMetAfter": "La condición de la tarea '{1}' no se cumplió tras ejecutar el trabajo, se reintenta",
        "app.domain.entities.task.abortedNotContinuing": "La tarea '{1}' fue abortada, no se continúa",
        "app.domain.entities.task.error": "Error en la tarea '{1}': {2}",
        "app.domain.entities.task.failedNoContinue": "La tarea '{1}' falló y no continuará porque 'continuar en error' está deshabilitado",
        "app.domain.entities.task.maxRetries": "Se alcanzó el máximo de reintentos para la tarea '{1}'",
        "app.domain.entities.task.retrying": "Reintentando la tarea '{1}' en {2} ms",
        "app.domain.entities.task.abortedDuringRetryWait": "La tarea '{1}' fue abortada durante la espera para reintentar.",
        "app.domain.entities.task.noJobConfigured": "No hay un trabajo válido configurado para la tarea '{1}'",

        "app.domain.entities.condition.evaluationAborted": "La evaluación de la condición '{1}' fue abortada.",
        "app.domain.entities.condition.notMet": "La condición '{1}' no se cumplió.",
    },
    en: {
        "app.domain.entities.job.executed": "Job '{1}' executed",
        "app.domain.entities.job.aborted": "Job '{1}' execution was aborted.",
        "app.domain.entities.job.abortedByUser": "Job '{1}' execution was aborted by the user.",
        "app.domain.entities.job.failed": "Job execution failed: {1}",
        "app.domain.entities.job.finished": "Job execution finished successfully in {1} ms.",

        "app.domain.entities.job.wait.invalidTimeParameter": "Invalid 'time' parameter for job '{1}': {2}",
        "app.domain.entities.job.contextRequired": "Context is required to execute job '{1}'",
        "app.domain.entities.job.abortSignalRequired": "AbortSignal is required to execute job '{1}'",
        "app.domain.entities.job.wait.aborted": "Job '{1}' was aborted",
        "app.domain.entities.job.wait.completed": "Job '{1}' completed successfully",

        "app.domain.entities.job.sendUdp.starting": "Starting job '{1}'",
        "app.domain.entities.job.sendUdp.sendingToBroadcast": "Sending UDP packet to broadcast address {1}:{2}",
        "app.domain.entities.job.sendUdp.failed": "Failed to send UDP packet: {1}",
        "app.domain.entities.job.sendUdp.sent": "UDP packet '{1}' sent to {2}:{3}",
        "app.domain.entities.job.sendUdp.finished": "Job '{1}' has finished",

        "app.domain.entities.job.sendTcp.failed": "Failed to send TCP packet: {1}",
        "app.domain.entities.job.sendTcp.sent": "TCP packet sent to {1}:{2}",

        "app.domain.entities.job.wakeOnLan.starting": "Starting job '{1}'",
        "app.domain.entities.job.wakeOnLan.failed": "Failed to send UDP packet: {1}",
        "app.domain.entities.job.wakeOnLan.sent": "UDP packet to wake device with MAC '{1}' sent to port {2}",
        "app.domain.entities.job.wakeOnLan.finished": "Job '{1}' has finished",

        "app.domain.entities.job.sendPjLink.starting": "Starting PJLink command {1} to {2}",
        "app.domain.entities.job.sendPjLink.completed": "PJLink command completed successfully in {1}",
        "app.domain.entities.job.sendPjLink.unknownCommand": "Unknown PJLink command: {1}",
        "app.domain.entities.job.sendPjLink.timeout": "Timeout while communicating with the PJLink device",
        "app.domain.entities.job.sendPjLink.authRequired": "The device requires PJLink authentication",

        "app.domain.entities.trigger.activated": "Trigger '{1}' activated",
        "app.domain.entities.trigger.disarmed": "Trigger '{1}' disarmed",
        "app.domain.entities.trigger.rearmed": "Trigger '{1}' rearmed automatically",

        "app.domain.entities.condition.evaluationSucceeded": "Condition '{1}' evaluation succeeded",
        "app.domain.entities.condition.evaluationFailed": "Error during condition '{1}' evaluation: {2}",
        "app.domain.entities.condition.pingFailed": "Condition '{1}' check failed: destination unreachable",
        "app.domain.entities.condition.pjlinkUnknownStatus": "Unknown PJLink status: {1}",
        "app.domain.entities.condition.pjlinkTimeout": "Timeout while querying the PJLink device",
        "app.domain.entities.condition.pjlinkAuthRequired": "PJLink device requires authentication",
        "app.domain.entities.condition.pjlinkErrorResponse": "PJLink device returned an error response: {1}",

        "app.domain.entities.routine.notEnabled": "Routine '{1}' is not enabled",
        "app.domain.entities.routine.invalidTrigger": "Routine '{1}' is not triggered by a valid trigger",
        "app.domain.entities.routine.alreadyRunning": "Routine '{1}' is already running",
        "app.domain.entities.routine.invalidContext": "An invalid context was provided for routine '{1}'",
        "app.domain.entities.routine.autoCheckingConditions": "Autochecking conditions for {1} tasks",
        "app.domain.entities.routine.checkingConditionForTask": "Checking condition for task '{1}'",
        "app.domain.entities.routine.started": "Routine '{1}' started",
        "app.domain.entities.routine.runningTasksInSync": "Running tasks in sync...",
        "app.domain.entities.routine.runningTask": "Running task '{1}'...",
        "app.domain.entities.routine.taskCompleted": "Task '{1}' completed",
        "app.domain.entities.routine.taskAborted": "Task '{1}' aborted: {2}",
        "app.domain.entities.routine.taskFailed": "Task '{1}' failed: {2}",
        "app.domain.entities.routine.runningTasksInParallelBreak": "Running tasks in parallel without continueOnError...",
        "app.domain.entities.routine.tasksCompletedWithResult": "Tasks completed: {1}",
        "app.domain.entities.routine.tasksAborted": "Tasks aborted: {1}",
        "app.domain.entities.routine.runningTasksInParallelContinue": "Running tasks in parallel with continueOnError...",
        "app.domain.entities.routine.tasksCompletedList": "Tasks completed: {1}",
        "app.domain.entities.routine.taskFailedReason": "Task failed: {1}",
        "app.domain.entities.routine.taskFulfilledValue": "Task completed: {1}",
        "app.domain.entities.routine.completed": "Routine completed successfully in {1} ms",
        "app.domain.entities.routine.aborted": "Routine was aborted: {1}",
        "app.domain.entities.routine.timedOut": "Routine timed out: {1}",
        "app.domain.entities.routine.failed": "Routine ended with error: {1}",
        "app.domain.entities.routine.breakOnErrorDisabled": "Task failed. Breaking execution because 'Continue on error' is disabled.",
        "app.domain.entities.routine.tasksFailedDetails": "Some tasks failed. Check logs for details.",
        "app.domain.entities.routine.abortSignal": "Abort signal received",

        "app.domain.entities.task.starting": "Starting task '{1}'",
        "app.domain.entities.task.aborted": "Task '{1}' aborted",
        "app.domain.entities.task.timedOut": "Task '{1}' timed out",
        "app.domain.entities.task.failed": "Task '{1}' failed: {2}",
        "app.domain.entities.task.completed": "Task '{1}' completed successfully in {2} ms",
        "app.domain.entities.task.conditionMet": "Condition met for task '{1}', finishing execution",
        "app.domain.entities.task.checkingConditionBefore": "Checking condition before executing task '{1}'",
        "app.domain.entities.task.executingJobAttempt": "Executing job for task '{1}', attempt {2} of {3}",
        "app.domain.entities.task.noCondition": "No condition set for task '{1}', finishing execution",
        "app.domain.entities.task.conditionNotMetAfter": "Condition not met for task '{1}' after job execution, will retry",
        "app.domain.entities.task.abortedNotContinuing": "Task '{1}' aborted, not continuing",
        "app.domain.entities.task.error": "Error in task '{1}': {2}",
        "app.domain.entities.task.failedNoContinue": "Task '{1}' failed and will not continue because continueOnError is false",
        "app.domain.entities.task.maxRetries": "Max retries reached for task '{1}'",
        "app.domain.entities.task.retrying": "Retrying task '{1}' in {2} ms",
        "app.domain.entities.task.abortedDuringRetryWait": "Task '{1}' was aborted during the retry wait.",
        "app.domain.entities.task.noJobConfigured": "No valid job configured for task '{1}'",

        "app.domain.entities.condition.evaluationAborted": "Condition '{1}' evaluation was aborted.",
        "app.domain.entities.condition.notMet": "Condition '{1}' was not met.",
    }
};

export default dictionary;
