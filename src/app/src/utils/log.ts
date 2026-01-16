import logEvents from "@common/events/log.events";
import EventEmitter from "events";
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class Log {
  source: string;
  verbose: boolean;
  static eventEmitter: EventEmitter;

  constructor(source: string, verbose: boolean = false, eventEmitter?: EventEmitter) {
    this.source = source;
    this.verbose = verbose;
    Log.eventEmitter = eventEmitter || new EventEmitter();
  }

  static createInstance(source: string, verbose: boolean = false): Log {
    return new Log(
      source, 
      verbose,
      this.eventEmitter
    );
  }

  info(message: string, data?: any) { return this.#emit('info', message, data); }
  warn(message: string, data?: any) { return this.#emit('warn', message, data); }
  error(message: string, data?: any) { return this.#emit('error', message, data); }
  debug(message: string, data?: any) { return this.#emit('debug', message, data); }

  #emitEvent(event: string, message: string, data?: any) {
    Log.eventEmitter.emit(event, { message, data });
  }

  async #emit(level: LogLevel, message: string, data?: any): Promise<void> {

    let line = '';
    line += `[${new Date().toISOString()}] [${level.toUpperCase()}] [${this.source}] - ${message} `;

    if (this.verbose) {
      this.#writeToConsole(level, line, data);
    }

    let event = ""
    switch (level) {
      case 'info':
        event = logEvents.logInfo
        break;
      case 'warn':
        event = logEvents.logWarning
        break;
      case 'error':
        event = logEvents.logError
        break;
      case 'debug':
        event = logEvents.logDebug
        break;
    }

    this.#emitEvent(event, message, data);
  }

  #writeToConsole(level: LogLevel, line: string, data?: any) {
    if (!this.verbose && level === 'debug') return;
    if (level === 'error') console.error(line, data || '');
    else if (level === 'warn') console.warn(line, data || '');
    else if (level === 'debug') console.debug(line, data || '');
    else console.log(line, data || '');
  }

}
