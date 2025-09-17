import * as net from "net";
import * as dgram from "dgram";
import {Log} from "@src/utils/log";
const log = Log.createInstance("checkIfPortIsInUse", true);

/**
 * Verifica si un puerto TCP está en uso en el sistema.
 * @param port Número de puerto a comprobar.
 * @returns Promise que se resuelve con "true" si el puerto está en uso, o "false" en caso contrario.
 */
export function isTcpPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        log.info(`Checking TCP port ${port} availability...`);

        server.once("error", (error: any) => {
            if (error.code === "EADDRINUSE") {
                log.info(`TCP port ${port} is in use.`);
                resolve(false);
            } else {
                log.error(`Error checking TCP port ${port}:`, error);
                reject(error);
            }
        });

        server.once("listening", () => {
            log.info(`TCP port ${port} is available.`);
            server.close();
            resolve(true);
        });

        server.listen(port, "0.0.0.0");
    });
}

/**
 * Verifica si un puerto UDP está en uso en el sistema.
 * @param port Número de puerto a comprobar.
 * @returns Promise que se resuelve con "true" si el puerto está en uso, o "false" en caso contrario.
 */
export function isUdpPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket("udp4");
        log.info(`Checking UDP port ${port} availability...`);

        socket.once("error", (error: any) => {
            if (error.code === "EADDRINUSE") {
                log.info(`UDP port ${port} is in use.`);
                resolve(false);
            } else {
                log.error(`Error checking UDP port ${port}:`, error);
                reject(error);
            }
            socket.close();
        });

        socket.once("listening", () => {
            log.info(`UDP port ${port} is available.`);
            socket.close();
            resolve(true);
        });

        socket.bind(port, "0.0.0.0");
    });
}

export default {
    isTcpPortAvailable,
    isUdpPortAvailable,
};