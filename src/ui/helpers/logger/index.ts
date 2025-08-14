
const enableLogging = true

export class Logger {
    static log(message: string, ...optionalParams: any[]) {
        if (!enableLogging) return;
        console.log(`[${new Date().toISOString()}] ${message}`, ...optionalParams);
    }

    static error(message: string, ...optionalParams: any[]) {
        if (!enableLogging) return;
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...optionalParams);
    }

    static warn(message: string, ...optionalParams: any[]) {
        if (!enableLogging) return;
        console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...optionalParams);
    }
}