import timeoutEvents from "@common/events/timeout.events";
import { EventEmitter } from "events";

export class TimeoutController extends EventEmitter {
    abortController: AbortController | null
    timeout: NodeJS.Timeout | null
    timedout: boolean = false;
    enable: boolean = true;

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
        this.abortController?.signal.removeEventListener("abort", this.#handleOnAbort.bind(this));
        this.abortController?.abort();
        this.timeout = null;
        this.timedout = true;
        this.abortController = null;
        this.#dispatchEvents(timeoutEvents.timeout);
    }

    clear() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (this.abortController) {
            this.abortController.signal.removeEventListener("abort", this.#handleOnAbort.bind(this));
            this.abortController.abort();
            this.abortController = null;
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

            abortSignal.addEventListener("abort", handleOnAbort);

            this.#dispatchEvents(timeoutEvents.running);

            this.abortController = new AbortController();
            this.abortController.signal.addEventListener("abort", this.#handleOnAbort.bind(this));

            this.timedout = false;

            this.timeout = setTimeout(() => {
                this.#handleOnTimeout();
                this.clear();
                abortSignal.removeEventListener("abort", handleOnAbort);
                reject("Timeout expired");
            }, this.milliseconds);
        });
    }
}