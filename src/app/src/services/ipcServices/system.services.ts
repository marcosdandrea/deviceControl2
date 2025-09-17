import App from "@src/domain/entities/app";
import { ServerManager } from "../server/serverManager";

export const getSystemTime = (_data: null, cb: Function) => {
    cb({ time: new Date().toISOString() });
}

export const getAppVersion = (_data: null, cb: Function) => {
    cb({ version: App.getAppVersion() });
}

export const getServerPorts = (_data: null, cb: Function) => {
    const mainServer = ServerManager.getInstance("main");
    const generalServer = ServerManager.getInstance("general");
    cb({ 
        main: mainServer.port,
        general: generalServer.port
     });
}

export const checkUDPPortAvailability = async (data: { port: number }, cb: Function) => {
    const { port } = data;
    const {isUdpPortAvailable} = await import('@src/utils/checkIfPortIsInUse.js');
    isUdpPortAvailable(port).then(isAvailable => {
        cb({ isAvailable });
    });
}

export const checkTCPPortAvailability = async (data: { port: number }, cb: Function) => {
    const { port } = data;
    const {isTcpPortAvailable} = await import('@src/utils/checkIfPortIsInUse.js');
    isTcpPortAvailable(port).then(isAvailable => {
        cb({ isAvailable });
    });
}
