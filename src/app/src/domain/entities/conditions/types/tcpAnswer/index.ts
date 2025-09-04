import { Condition } from "../..";
import { ConditionType } from "@common/types/condition.type";
import net from 'net';
import { conditionTypes } from "..";

interface ConditionTCPAnswerParams extends Partial<ConditionType> {
    ip: string;
    port: number;
    message: string;
    answer: string;
    timeoutValue?: number;
}

export class ConditionTCPAnswer extends Condition {
    static type: string
    ip: string;
    port: number;
    message: string;
    answer: string;

    constructor(options: ConditionTCPAnswerParams) {
        super({
            ...options,
            type: conditionTypes.tcpAnswer,
            name: options.name || "TCP Answer Condition",
            description: options.description || "Condition that waits for a TCP answer",
            timeoutValue: options.timeoutValue
        } as ConditionType);

        const ipMask = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!options.params.ip || !ipMask.test(options.params.ip))
            throw new Error("Ip address must be a valid IPv4 address");
        if (typeof options.params.port !== 'number' || options.params.port < 0 || options.params.port > 65535)
            throw new Error("Port must be a number between 0 and 65535");
        if (!options.params.message || typeof options.params.message !== 'string')
            throw new Error("Message must be a string");
        if (!options.params.answer || typeof options.params.answer !== 'string')
            throw new Error("Answer must be a string");

        this.ip = options.params.ip;
        this.port = options.params.port;
        this.message = options.params.message;
        this.answer = options.params.answer;
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let buf = "";                             // acumulador
            const expected = this.answer;

            const onAbort = () => {
                client.destroy();
                reject(new Error("Condition evaluation aborted"));
            };

            if (abortSignal.aborted) return onAbort();
            abortSignal.addEventListener("abort", onAbort, { once: true });

            // si sabés la codificación, mejor
            client.setEncoding("utf8"); // opcional, así 'data' ya es string

            client.connect(this.port, this.ip, () => {
                client.write(this.message);
            });

            const cleanup = () => {
                abortSignal.removeEventListener("abort", onAbort);
                client.destroy();
            };

            client.on("data", (chunk: Buffer | string) => {
                // Convertí y acumulá
                const piece = typeof chunk === "string" ? chunk : chunk.toString("utf8");
                buf += piece;

                // Log seguro: escapamos \r y \n para verlos
                const debugVisible = piece.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
                this.logger.debug(`Received chunk: "${debugVisible}" | bufferLen=${buf.length}`);

                // Normalizá para comparar (sacá CR/LF y espacios laterales)
                const normalized = buf.replace(/\r/g, "").replace(/\n/g, "").trim();

                // Si la respuesta puede venir pegada con otras cosas, usá includes
                if (normalized.includes(expected)) {
                    this.logger.debug(`Matched expected answer: "${expected}"`);
                    cleanup();
                    resolve(true);
                }

                // Si esperás un terminador claro (ej. \r\n), también podés cortar por líneas:
                // const lines = buf.split(/\r?\n/);
                // procesar líneas completas y dejar la última (parcial) en buf = lines.pop()!;
            });

            client.on("error", (err) => {
                cleanup();
                reject(err);
            });

            // Opcional: timeout de seguridad
            /*
            if (this.timeoutValue && this.timeoutValue > 0) {
                client.setTimeout(this.timeoutValue, () => {
                    console.warn("TCP condition timeout");
                    cleanup();
                    resolve(false); // o reject(new Error("timeout"))
                });
            }*/
        });
    }

}

export default ConditionTCPAnswer;
