import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import { jobTypes } from "..";
import net from "net";
import { Context } from "@src/domain/entities/context";
import dictionary from "@common/i18n";

const PJLINK_PORT = 4352;

const COMMANDS = {
    powerOn: {
        label: "Encender dispositivo",
        command: "%1POWR 1",
    },
    powerOff: {
        label: "Apagar dispositivo",
        command: "%1POWR 0",
    },
  
} as const;

type CommandKey = keyof typeof COMMANDS;

interface SendPJLinkJobParams extends JobType {
    params: {
        ipAddress: string;
        command: CommandKey;
    }
}

export class SendPJLinkJob extends Job {
    static description = "Envía comandos PJLink 2.10 a un dispositivo.";

    static name = "Enviar comando PJLink 2.10";
    static type = jobTypes.sendPJLinkJob;

    constructor(options: SendPJLinkJobParams) {
        super({
            ...options,
            type: jobTypes.sendPJLinkJob,
            timeout: 5000,
            enableTimoutWatcher: true,
        });

        this.validateParams();
    }

    requiredParams(): requiredJobParamType[] {
        const commandOptions = Object.entries(COMMANDS).map(([value, data]) => ({
            label: data.label,
            value,
        }));

        return [
            {
                name: "ipAddress",
                type: "string",
                validationMask: "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
                description: "Dirección IP del dispositivo PJLink",
                required: true,
            },
            {
                name: "command",
                type: "select",
                validationMask: `^(${Object.keys(COMMANDS).join("|")})$`,
                description: "Comando PJLink a ejecutar",
                required: true,
                options: commandOptions,
            },
        ];
    }

    async job(ctx: Context): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        const { ipAddress, command } = this.params as SendPJLinkJobParams["params"];
        const displayName = this.name || this.id;

        const selectedCommand = COMMANDS[command as CommandKey];
        if (!selectedCommand)
            throw new Error(`Comando PJLink desconocido: ${command}`);

        ctx.log.info(dictionary("app.domain.entities.job.sendPjLink.starting", selectedCommand.command, ipAddress));
        this.log.info(dictionary("app.domain.entities.job.sendPjLink.starting", selectedCommand.command, ipAddress));

        await new Promise<void>((resolve, reject) => {
            const client = new net.Socket();
            let buffer = "";
            let handshakeCompleted = false;
            let finished = false;

            const cleanup = () => {
                if (finished) return;
                finished = true;
                client.removeAllListeners();
                client.destroy();
                if (abortSignal)
                    abortSignal.removeEventListener("abort", onAbort);
                clearTimeout(timeoutId);
            };

            const safeResolve = () => {
                cleanup();
                resolve();
            };

            const safeReject = (error: Error) => {
                cleanup();
                reject(error);
            };

            const onAbort = () => {
                safeReject(new Error(`Job "${displayName}" was aborted`));
            };

            if (abortSignal) {
                if (abortSignal.aborted) {
                    onAbort();
                    return;
                }
                abortSignal.addEventListener("abort", onAbort, { once: true });
            }

            const timeoutId = setTimeout(() => {
                safeReject(new Error("Tiempo de espera agotado al comunicarse con el dispositivo PJLink"));
            }, 5000);

            client.setEncoding("utf8");

            client.on("error", (err) => {
                this.failed = true;
                safeReject(err);
            });

            client.on("data", (chunk: string | Buffer) => {
                const piece = typeof chunk === "string" ? chunk : chunk.toString("utf8");
                buffer += piece;
                const visible = piece.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
                this.log.debug(`PJLink RX: "${visible}"`);

                if (!handshakeCompleted) {
                    if (buffer.includes("PJLINK 1")) {
                        safeReject(new Error("El dispositivo requiere autenticación PJLink"));
                        return;
                    }

                    if (buffer.includes("PJLINK 0")) {
                        handshakeCompleted = true;
                        buffer = "";
                        const payload = `${selectedCommand.command}\r`;
                        client.write(payload, (error) => {
                            if (error) {
                                safeReject(error);
                                return;
                            }

                            this.log.info(`Comando enviado: ${selectedCommand.command}`);
                            safeResolve();
                        });

                    }

                    return;
                }

            });

            client.connect(PJLINK_PORT, ipAddress);
        });

        this.log.info(dictionary("app.domain.entities.job.sendPjLink.completed", ipAddress));
        ctx.log.info(dictionary("app.domain.entities.job.sendPjLink.completed", ipAddress));
    }
}

export default SendPJLinkJob;
