import nodeMailer from 'nodemailer';
import { JobType } from "@common/types/job.type";
import { jobTypes } from "..";
import { Job } from "../..";
import { getLastProject } from '@src/domain/useCases/project';

interface SendMailJobParams extends JobType {
    params: {
        to: string;
        subject: string;
        body: string;
        snmpServer: string;
        snmpPort?: number;
        ssl?: boolean;
        username?: string;
        password?: string;
    } & Record<string, any>;
}

export class SendMailJob extends Job {
    static name = "Enviar correo electronico";
    static description = "Sends an email using specified SMTP server.";
    static type = jobTypes.sendMailJob;

    constructor(options: SendMailJobParams) {
        super({
            ...options,
            timeout: 10000,
            enableTimoutWatcher: true,
            type: jobTypes.sendMailJob,
        });

        this.validateParams();
    }

    requiredParams() {
        return [
            {
            name: "to",
            validationMask: "^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,}$",
            description: "Recipient email address",
            easyName: "Para",
            type: "string" as const,
            required: true,
            },
            {
            name: "subject",
            validationMask: "^(?!\\s*$).+",
            description: "Email subject",
            easyName: "Asunto",
            type: "string" as const,
            required: true,
            },
            {
            name: "body",
            validationMask: "^(?!\\s*$).+",
            description: "Email body content",
            easyName: "Cuerpo",
            type: "textBox" as const,
            required: true,
            },
            {
            name: "smtpServer",
            validationMask: "^(?!\\s*$)(?:(?:[a-zA-Z\\d](?:[a-zA-Z\\d-]{0,61}[a-zA-Z\\d])?\\.)+[a-zA-Z]{2,}|localhost|(?:(?:\\d{1,3}\\.){3}\\d{1,3}))$",
            description: "SMTP server address",
            easyName: "Servidor SMTP",
            type: "string" as const,
            required: true,
            },
            {
            name: "ssl",
            validationMask: "^(true|false)$",
            description: "Use SSL for SMTP",
            easyName: "Usar SSL",
            type: "boolean" as const,
            required: false,
            },
            {
            name: "username",
            validationMask: "^[\\s\\S]*$",
            description: "SMTP username",
            easyName: "Usuario SMTP",
            type: "string" as const,
            required: false,
            },
            {
            name: "password",
            validationMask: "^[\\s\\S]*$",
            description: "SMTP password",
            easyName: "Contraseña SMTP",
            type: "password" as const,
            required: false,
            }
        ];
    }

    async job(): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        this.log.info(`Starting job \"${this.name}\" with ID ${this.id}`);

        const { to, subject, body, smtpServer, ssl, username, password } = this.params;

        try {
            const transporter = nodeMailer.createTransport({
                host: smtpServer,
                port: ssl ? 465 : 587,
                secure: ssl || false,
                auth: username && password ? { user: username, pass: password } : undefined,
            });
            console.log('Sending email...', {
                to, subject, body, smtpServer, ssl, username, password
            });
            
            const currentProject = await getLastProject()
            const projectName = currentProject?.name || 'Proyecto sin nombre'

            await transporter.sendMail({
                from: `${projectName}@devicecontrol2.com`,
                to,
                subject: `${subject} - Device Control 2`,
                text: body,
            });
        } catch (error) {
            this.failed = true;
            this.dispatchEvent('jobError', { jobId: this.id, error });
            this.log.error(`Failed to send email: ${error}`);
            console.error(error);
            throw error;
        }

        this.log.info(`Job "${this.name}" with ID ${this.id} completed successfully`);
        return Promise.resolve();

    }
}

export default SendMailJob;