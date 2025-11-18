import timeoutEvents from "@common/events/timeout.events";
import { EventEmitter } from "events";

export class TimeoutController extends EventEmitter {
    abortController: AbortController | null
    timeout: NodeJS.Timeout | null
    timedout: boolean = false;
    enable: boolean = true;
    private externalAbortHandler: (() => void) | null = null;
    private internalAbortHandler: (() => void) | null = null;
    private externalAbortSignal: AbortSignal | null = null;

    constructor(public milliseconds: number) {
        super();
        this.abortController = null
        this.timeout = null
        this.timedout = false;
        this.enable = true
        if (typeof milliseconds !== "number" || milliseconds <= 0)
            throw new Error("Timeout milliseconds must be a number greater than zero");

        this.milliseconds = milliseconds;
    }

    #dispatchEvents(event) {
        this.emit(event);
    }

    #handleOnAbort() {
        this.#dispatchEvents(timeoutEvents.aborted);
    }

    #handleOnTimeout() {
        if (this.internalAbortHandler && this.abortController) {
            this.abortController.signal.removeEventListener("abort", this.internalAbortHandler);
        }
        this.abortController?.abort();
        this.timeout = null;
        this.timedout = true;
        this.abortController = null;
        this.internalAbortHandler = null;
        this.#dispatchEvents(timeoutEvents.timeout);
    }

    clear() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (this.abortController && this.internalAbortHandler) {
            this.abortController.signal.removeEventListener("abort", this.internalAbortHandler);
            this.abortController.abort();
            this.abortController = null;
            this.internalAbortHandler = null;
        }
        if (this.externalAbortSignal && this.externalAbortHandler) {
            this.externalAbortSignal.removeEventListener("abort", this.externalAbortHandler);
            this.externalAbortHandler = null;
            this.externalAbortSignal = null;
        }
    }

    start(abortSignal: AbortSignal): Promise<void> {
        return new Promise<void>((_resolve, reject) => {
            if (!this.enable)
                return;

            if (this.abortController)
                throw new Error("Timeout already started");

            if (abortSignal.aborted) {
                this.#handleOnAbort();
                this.clear();
                reject("Timeout aborted");
                return;
            }

            const handleOnAbort = () => {
                this.clear();
                this.#handleOnAbort();
                reject("Timeout aborted");
            }

            this.externalAbortHandler = handleOnAbort;
            this.externalAbortSignal = abortSignal;
            abortSignal.addEventListener("abort", handleOnAbort);

            this.#dispatchEvents(timeoutEvents.running);

            this.abortController = new AbortController();
            this.internalAbortHandler = this.#handleOnAbort.bind(this);
            this.abortController.signal.addEventListener("abort", this.internalAbortHandler);

            this.timedout = false;

            this.timeout = setTimeout(() => {
                this.#handleOnTimeout();
                if (this.externalAbortSignal && this.externalAbortHandler) {
                    this.externalAbortSignal.removeEventListener("abort", this.externalAbortHandler);
                    this.externalAbortHandler = null;
                    this.externalAbortSignal = null;
                }
                reject("Timeout expired");
            }, this.milliseconds);
        });
    }
}