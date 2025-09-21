import { Condition } from "../..";
import { ConditionType, requiredConditionParamType } from "@common/types/condition.type";
import net from "net";
import { conditionTypes } from "..";

const PJLINK_PORT = 4352;
const STATUS_OPTIONS = {
    powerOn: {
        label: "Chequear encendido",
        expectedResponse: "%1POWR=1",
    },
    powerOff: {
        label: "Chequear apagado",
        expectedResponse: "%1POWR=0",
    },
} as const;

type StatusKey = keyof typeof STATUS_OPTIONS;

interface ConditionPJLinkPowerParams extends Partial<ConditionType> {
    params: {
        ip: string;
        status: StatusKey;
    };
}

export class ConditionPJLinkPower extends Condition {
    static description = "Comprueba el estado de encendido de un dispositivo PJLink 2.10.";
    static name = "Comprobar PJLink 2.10";
    static type = conditionTypes.pjLinkPower;

    constructor(options: ConditionPJLinkPowerParams) {
        super({
            ...options,
            type: conditionTypes.pjLinkPower,
            name: options.name || ConditionPJLinkPower.name,
            description: options.description || ConditionPJLinkPower.description,
        } as ConditionType);

        this.validateParams();
    }

    requiredParams(): requiredConditionParamType[] {
        return [
            {
                name: "ip",
                required: true,
                type: "string",
                validationMask: "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
                description: "Dirección IP del dispositivo PJLink",
            },
            {
                name: "status",
                required: true,
                type: "select",
                validationMask: `^(${Object.keys(STATUS_OPTIONS).join("|")})$`,
                description: "Estado que se desea comprobar",
                options: Object.entries(STATUS_OPTIONS).map(([value, data]) => ({
                    label: data.label,
                    value,
                })),
            },
        ];
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        const { ip, status } = this.params as ConditionPJLinkPowerParams["params"];
        const expected = STATUS_OPTIONS[status as StatusKey];

        if (!expected) {
            throw new Error(`Estado PJLink desconocido: ${status}`);
        }

        this.logger.info(`Comprobando estado PJLink (${expected.label}) en ${ip}`);

        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let buffer = "";
            let handshakeCompleted = false;
            let finished = false;

            const cleanup = () => {
                if (finished) return;
                finished = true;
                client.removeAllListeners();
                client.destroy();
                abortSignal.removeEventListener("abort", onAbort);
                clearTimeout(timeoutId);
            };

            const safeResolve = () => {
                cleanup();
                resolve(true);
            };

            const safeReject = (error: Error) => {
                cleanup();
                reject(error);
            };

            const onAbort = () => {
                safeReject(new Error("Condition evaluation aborted"));
            };

            if (abortSignal.aborted) {
                onAbort();
                return;
            }

            abortSignal.addEventListener("abort", onAbort, { once: true });

            const timeoutId = setTimeout(() => {
                safeReject(new Error("Timeout esperando respuesta del dispositivo PJLink"));
            }, 5000);

            client.setEncoding("utf8");

            client.on("error", (err) => {
                safeReject(err);
            });

            client.on("data", (chunk: string | Buffer) => {
                const piece = typeof chunk === "string" ? chunk : chunk.toString("utf8");
                buffer += piece;
                const visible = piece.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
                this.logger.debug(`PJLink RX: "${visible}"`);

                if (!handshakeCompleted) {
                    if (buffer.includes("PJLINK 1")) {
                        safeReject(new Error("El dispositivo requiere autenticación PJLink"));
                        return;
                    }

                    if (buffer.includes("PJLINK 0")) {
                        handshakeCompleted = true;
                        buffer = "";
                        client.write("%1POWR ?\r");
                        this.logger.debug("Consulta de estado enviada: %1POWR ?");
                    }

                    return;
                }

                const normalized = buffer.replace(/\r/g, "").replace(/\n/g, "").trim();

                if (normalized.includes(expected.expectedResponse)) {
                    safeResolve();
                    return;
                }

                if (/^%\d?ERR\d/.test(normalized)) {
                    safeReject(new Error(`Respuesta PJLink de error: ${normalized}`));
                }
            });

            client.connect(PJLINK_PORT, ip);
        });
    }
}

export default ConditionPJLinkPower;
