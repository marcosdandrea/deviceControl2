import { getConditionTypes } from "@src/domain/entities/conditions/types"
import { getJobTypes } from "@src/domain/entities/job/types"
import { getTriggerTypes } from "@src/domain/entities/trigger/types"
import { Log } from "@src/utils/log"
import { broadcastToClients } from "."
import appCommands from "@common/commands/app.commands"
import { Socket } from "socket.io"
import systemEvents from "@common/events/system.events"
const log = new Log("AppServices", false)

const getAvailableTriggers = async (_args: any, callback: Function) => {
    const triggerClasses = await getTriggerTypes()
    let triggers: Record<string, any> = {}

    for (const [key, modulePromise] of Object.entries(await triggerClasses)) {
        try {
            const module = await modulePromise
            triggers[key] = {
                easyName: module.default.easyName,
                moduleDescription: module.default.moduleDescription,
                disableRearming: module.default.disableRearming,
                params: await module.default.prototype.requiredParams(),
            }
        } catch (error) {
            broadcastToClients(systemEvents.appLogError, { message: `Error cargando el trigger de tipo ${key}: ${(error as Error).message}` })
            log.error(`Error loading trigger type ${key}: ${(error as Error).message}`)
        }
    }
    callback?.(triggers)
    return triggers


}

const getAvailableJobs = async (_args: any, callback: Function) => {
    const jobClasses = await getJobTypes()
    let jobs: Record<string, any> = {}

    for (const [key, modulePromise] of Object.entries(jobClasses)) {
        try {
            const module = await modulePromise
            jobs[key] = {
                name: module.default.name,
                description: module.default.description || "",
                params: module.default.prototype.requiredParams(),
            }
        } catch (error) {
            log.error(`Error loading job type ${key}: ${(error as Error).message}`)
        }
    }
    callback?.(jobs)
    return jobs
}

const getAvailableConditions = async (_args: any, callback: Function) => {
    const conditionClasses = await getConditionTypes()
    let conditions: Record<string, any> = {}

    for (const [key, modulePromise] of Object.entries(conditionClasses)) {
        const module = await modulePromise
        conditions[key] = {
            name: module.default.name,
            description: module.default.description || "",
            params: module.default.prototype.requiredParams(),
        }
    }
    callback?.(conditions)
    return conditions
}

let usersWhichBlockedControl: string[] = []

const blockMainControlView = async (socket: Socket, callback: Function) => {
    socket.on('disconnect', unblockMainControlView.bind(null, socket, undefined))
    usersWhichBlockedControl.push(socket.id)
    broadcastToClients(appCommands.blockMainControl, null)
    callback?.({ success: true })
    return { success: true }
}

const unblockMainControlView = async (socket: Socket, callback?: Function) => {
    socket.off('disconnect', unblockMainControlView.bind(null, socket, undefined))
    usersWhichBlockedControl = usersWhichBlockedControl.filter(id => id !== socket.id)
    broadcastToClients(appCommands.unblockMainControl, null)
    callback?.({ success: true })
    return { success: true }
}

const checkLicense = async (_args: any, callback: Function): Promise<{ isValid: boolean; fingerprint: string | null }> => {
    const { getLicenseInfo, getSystemFingerprint } = await import('@src/services/licensing/index.js');
    try {
        const fingerprint = await getSystemFingerprint();
        const licenseInfo = await getLicenseInfo();
        const isValid = licenseInfo?.isValid ?? false;
        const expiresAt = licenseInfo?.expiresAt ?? null;
        const createdAt = licenseInfo?.createdAt ?? null;
        const data = licenseInfo?.data ?? null;
        log.info(`License valid: ${isValid}`);
        callback?.({ isValid, fingerprint, expiresAt, createdAt, data });
        return { isValid, fingerprint };
    } catch (error) {
        log.error(`Error checking license: ${(error as Error).message}`);
        callback?.({ isValid: false, fingerprint: null });
        return { isValid: false, fingerprint: null };
    }
};

const deleteLicense = async (_args: any, callback: Function) => {
    const { deleteLicenseFile } = await import('@src/services/licensing/index.js');
    try {
        const { Project } = await import('@src/domain/entities/project/index.js');
        if (Project.initialized) {
            throw new Error("Cannot delete license while a project is loaded. Please close the project first.");
        }
        await deleteLicenseFile();
        log.info('License deleted successfully');
        broadcastToClients(systemEvents.appLicenseUpdated, null);
        callback?.(true);
        return true;
    } catch (error) {
        log.error(`Error deleting license: ${(error as Error).message}`);
        broadcastToClients(systemEvents.appLogError, { message: `Error deleting license: ${(error as Error).message}` });
        callback?.({error: (error as Error).message});
        return false;
    }
}

const setLicense = async (args: any, callback: Function): Promise<boolean> => {
    const { setSystemLicense } = await import('@src/services/licensing/index.js');

    try {
        const licenseKey = args?.licenseKey;
        if (typeof licenseKey !== 'string') {
            log.error('Invalid license key format');
            callback?.(false);
            return false;
        }
        const result = await setSystemLicense(licenseKey);
        log.info(`License set result: ${result}`);
        callback?.(result);
        return result;
    } catch (error) {
        log.error(`Error setting license: ${(error as Error).message}`);
        callback?.(false);
        return false;
    }
}
export default {
    getAvailableTriggers,
    getAvailableJobs,
    getAvailableConditions,
    blockMainControlView,
    unblockMainControlView,
    checkLicense,
    setLicense,
    deleteLicense
}