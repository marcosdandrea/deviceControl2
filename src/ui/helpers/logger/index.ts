
// Enable logging only if we're working in a development port environment
// Production ports: 80, 8080
// Development port: 5123
const port = window.location.port;
const enableLogging = port !== "80" && port !== "8080";

// Store original console methods
const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);
const originalInfo = console.info.bind(console);
const originalDebug = console.debug.bind(console);

export class Logger {
    /**
     * Log a message (preserves original file location in DevTools)
     * Disabled in production (ports 80, 8080)
     */
    static log(...args: any[]) {
        if (!enableLogging) return;
        originalLog(...args);
    }

    /**
     * Log an error (preserves original file location in DevTools)
     * Disabled in production (ports 80, 8080)
     */
    static error(...args: any[]) {
        if (!enableLogging) return;
        originalError(...args);
    }

    /**
     * Log a warning (preserves original file location in DevTools)
     * Disabled in production (ports 80, 8080)
     */
    static warn(...args: any[]) {
        if (!enableLogging) return;
        originalWarn(...args);
    }

    /**
     * Log info (preserves original file location in DevTools)
     * Disabled in production (ports 80, 8080)
     */
    static info(...args: any[]) {
        if (!enableLogging) return;
        originalInfo(...args);
    }

    /**
     * Log debug info (preserves original file location in DevTools)
     * Disabled in production (ports 80, 8080)
     */
    static debug(...args: any[]) {
        if (!enableLogging) return;
        originalDebug(...args);
    }

    /**
     * Check if logging is enabled
     */
    static get isEnabled() {
        return enableLogging;
    }
}

// Export a shorthand for convenience
export const log = Logger.log;
export const logError = Logger.error;
export const logWarn = Logger.warn;
export const logInfo = Logger.info;
export const logDebug = Logger.debug;