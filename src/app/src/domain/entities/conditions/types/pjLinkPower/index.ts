import { Condition } from "../..";
import { ConditionType, requiredConditionParamType } from "@common/types/condition.type";
import net from "net";
import { conditionTypes } from "..";
import dictionary from "@common/i18n";

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
            throw new Error(dictionary("app.domain.entities.condition.pjlinkUnknownStatus", status));
        }

        this.logger.info(`Comprobando estado PJLink (${expected.label}) en ${ip}`);

        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let buffer = "";
            let handshakeCompleted = false;
            let finished = false;
            const displayName = this.name || this.id;

            const cleanup = () => {
                if (finished) return;
                finished = true;
                client.removeAllListeners();
                client.destroy();
                abortSignal.removeEventListener("abort", onAbort);
                if (timeoutId) clearTimeout(timeoutId);
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
                safeReject(new Error(dictionary("app.domain.entities.condition.evaluationAborted", displayName)));
            };

            if (abortSignal.aborted) {
                onAbort();
                return;
            }

            abortSignal.addEventListener("abort", onAbort, { once: true });

            const timeoutId = setTimeout(() => {
                safeReject(new Error(dictionary("app.domain.entities.condition.pjlinkTimeout")));
            }, 5000);

            client.setEncoding("utf8");

            client.on("error", (err) => {
                safeReject(err);
            });

            client.on("data", (chunk: string | Buffer) => {
                const piece = typeof chunk === "string" ? chunk : chunk.toString("utf8");
                buffer += piece;
                const visible = piece.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
                this.logger.debug(`PJLink RX: "${visible}" | Buffer acumulado: "${buffer.replace(/\r/g, "\\r").replace(/\n/g, "\\n")}"`);

                if (!handshakeCompleted) {
                    if (buffer.includes("PJLINK 1")) {
                        safeReject(new Error(dictionary("app.domain.entities.condition.pjlinkAuthRequired")));
                        return;
                    }

                    if (buffer.includes("PJLINK 0")) {
                        handshakeCompleted = true;
                        buffer = "";
                        this.logger.debug("Handshake completado, enviando consulta de estado...");
                        const query = "%1POWR ?\r";
                        client.write(query, (error) => {
                            if (error) {
                                safeReject(error);
                                return;
                            }
                            this.logger.debug(`Consulta de estado enviada: ${query.replace(/\r/g, "\\r")}`);
                        });
                    }

                    return;
                }

                // Ya completamos el handshake, procesamos la respuesta
                this.logger.debug(`Procesando respuesta post-handshake. Buffer: "${buffer}"`);
                
                // Normalizar el buffer para análisis
                const normalized = buffer.replace(/\r/g, "").replace(/\n/g, "").trim();
                this.logger.debug(`Buffer normalizado: "${normalized}"`);

                // Verificar si tenemos una respuesta completa (termina con \r o \n en el buffer original)
                if (buffer.includes("\r") || buffer.includes("\n")) {
                    this.logger.debug(`Respuesta completa detectada: "${normalized}"`);
                    
                    if (normalized.includes(expected.expectedResponse)) {
                        this.logger.info(`✓ Estado confirmado: ${expected.label}`);
                        safeResolve();
                        return;
                    }

                    if (/^%\d?ERR\d/.test(normalized)) {
                        safeReject(new Error(dictionary("app.domain.entities.condition.pjlinkErrorResponse", normalized)));
                        return;
                    }

                    // Si recibimos una respuesta diferente a la esperada, la condición falla
                    if (normalized.startsWith("%1POWR=")) {
                        this.logger.info(`✗ Estado no coincide. Esperado: ${expected.expectedResponse}, Recibido: ${normalized}`);
                        cleanup();
                        safeReject(new Error(dictionary("app.domain.entities.condition.pjlinkStatusMismatch", expected.label, normalized)));
                        return;
                    }
                }
            });

            this.logger.debug(`Conectando al dispositivo PJLink en ${ip}:${PJLINK_PORT}...`);
            client.connect(PJLINK_PORT, ip);
        });
    }
}

export default ConditionPJLinkPower;
