import { ServerManager } from "../server/serverManager";
import appUseCases from "@src/domain/useCases/app";
import { isLinux } from "@src/utils/index.js";
import { getLogRetentionDays as getLogRetentionDaysSetting, setLogRetentionDays as setLogRetentionDaysSetting } from "@src/services/systemSettings";
import { cleanupOldLogs } from "@src/services/logCleanup";

export const getSystemTime = (_data: null, cb: Function) => {
    cb({ time: new Date().toISOString() });
}

export const getAppVersion = (_data: null, cb: Function) => {
    cb({ version: appUseCases.getAppVersion().version });
}

export const getServerPorts = (_data: null, cb: Function) => {
    const mainServer = ServerManager.getInstance("main");
    const generalServer = ServerManager.getInstance("general");
    cb({
        main: mainServer.port,
        general: generalServer.port
    });
}

export const getServerIp = (_data: null, cb: Function) => {
    const mainServer = ServerManager.getInstance("main");
    const generalServer = ServerManager.getInstance("general");
    cb({
        main: mainServer.ip,
        general: generalServer.ip
    });
}

export const checkUDPPortAvailability = async (data: { port: number }, cb: Function) => {
    const { port } = data;
    const { isUdpPortAvailable } = await import('@src/utils/checkIfPortIsInUse.js');
    try {
        const isAvailable = await isUdpPortAvailable(Number(port));
        cb({ isAvailable });
    } catch (error) {
        cb({ isAvailable: false, error: error?.message || error });
    }
}

export const checkTCPPortAvailability = async (data: { port: number }, cb: Function) => {
    const { port } = data;
    const { isTcpPortAvailable } = await import('@src/utils/checkIfPortIsInUse.js');
    try {
        const isAvailable = await isTcpPortAvailable(Number(port));
        cb({ isAvailable });
    } catch (error) {
        cb({ isAvailable: false, error: error?.message || error });
    }
}

export const getIsLinux = (_data: null, cb: Function) => {
    cb({ isLinux });
}

export const getNetworkInterfaces = (_data: null, cb: Function) => {
    const mainServer = ServerManager.getInstance("main");
    cb({ interfaces: mainServer.getNetworkInterfaces() });
}

export const getLogRetentionDays = async (_data: null, cb: Function) => {
    try {
        const days = await getLogRetentionDaysSetting();
        cb({ success: true, days });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}

export const setLogRetentionDays = async (data: { days: number }, cb: Function) => {
    try {
        await setLogRetentionDaysSetting(data?.days);
        cb({ success: true });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}

export const runLogsCleanupNow = async (_data: null, cb: Function) => {
    try {
        const result = await cleanupOldLogs();
        cb({ success: true, ...result });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}