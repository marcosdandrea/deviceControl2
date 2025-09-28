
const LANG = String(process.env.DEFAULT_LANGUAGE || "es");


export const dictionary = (key: string, ...params: any[]): string => {    
    let translation = translations[LANG][key] || key;
    if (params) {
        params.forEach((param, index) => {
            translation = translation.replace(`{${index + 1}}`, param);
        });
    }
    return translation;
}

const translations: { [key: string]: { [key: string]: string } } = {
    es: {
        "app.domain.entities.job.executed": "Se ejecutó el trabajo '{1}'",
        "app.domain.entities.job.aborted": "La ejecución del trabajo fue abortada.",
        "app.domain.entities.job.abortedByUser": "La ejecución del trabajo '{%1}' fue abortada por el usuario.",
        "app.domain.entities.job.failed": "La ejecución del trabajo falló: {%1}",
        "app.domain.entities.job.finished": "La ejecución del trabajo ha finalizado exitosamente en {%1} ms.",
    },
    en: {
        "app.domain.entities.job.executed": "Job '{1}' executed",
        "app.domain.entities.job.aborted": "Job execution was aborted.",
        "app.domain.entities.job.abortedByUser": "Job '{%1}' execution was aborted by the user.",
        "app.domain.entities.job.failed": "Job execution failed: {%1}",
        "app.domain.entities.job.finished": "Job execution finished successfully in {%1} ms."
    }
}

export default dictionary;