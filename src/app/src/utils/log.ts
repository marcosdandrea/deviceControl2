
export class Log {
    source: string;
    verbose: boolean;

    constructor(source: string, verbose: boolean = false) {
        this.source = source;
        this.verbose = verbose;
    }

    info(message: string, ...args: any[]): void {
        if (this.verbose) {
            console.log(`[${this.source}] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        console.warn(`[${this.source}] ${message}`, ...args);
    }

    error(message: string, ...args: any[]): void {
        console.error(`[${this.source}] ${message}`, ...args);
    }

    debug(message: string, ...args: any[]): void {
        if (this.verbose) {
            console.debug(`[${this.source}] ${message}`, ...args);
        }
    }
}