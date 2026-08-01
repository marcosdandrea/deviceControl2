import { isPropietaryHardware } from "../hardwareManagement/utils"
import {Log} from "@src/utils/log"
import { Project } from "@src/domain/entities/project"
import { saveLastProject } from "@src/domain/useCases/project"

const log = Log.createInstance('Hardware Services', true);

const isSignedHarware = async (payload: any, callback: Function): Promise<boolean> => {
    const result = await isPropietaryHardware();
    log.info(`isSignedHarware result: ${result}`);
    callback?.(result);
    return result;
}

const turnScreenOn = async (payload: any, callback: Function): Promise<void> => {
    try {
        const { ScreenController } = await import("@src/services/hardwareManagement/screen/index.js");
        const screenController = ScreenController.getInstance();
        const project = Project.getInstance();
        await screenController.turnOn(project?.maxBrightness);
        callback?.({ success: true });
    } catch (error) {
        log.error(`Error turning screen on: ${(error as Error).message}`);
        callback?.({ success: false, error: (error as Error).message });
    }
}

const turnScreenOff = async (payload: any, callback: Function): Promise<void> => {
    try {
        const { ScreenController } = await import("@src/services/hardwareManagement/screen/index.js");
        const screenController = ScreenController.getInstance();
        await screenController.turnOff();
        callback?.({ success: true });
    } catch (error) {
        log.error(`Error turning screen off: ${(error as Error).message}`);
        callback?.({ success: false, error: (error as Error).message });
    }
}

const setScreenAutoOffTimeMs = async (payload: { ms: number }, callback: Function): Promise<void> => {
    try {
        const project = Project.getInstance();
        if (!project) throw new Error("No project is currently loaded.");
        project.setScreenAutoOffTimeMs(payload?.ms);
        await saveLastProject();
        callback?.({ success: true });
    } catch (error) {
        log.error(`Error setting screen auto-off time: ${(error as Error).message}`);
        callback?.({ success: false, error: (error as Error).message });
    }
}

const setMaxBrightness = async (payload: { percentage: number }, callback: Function): Promise<void> => {
    try {
        const project = Project.getInstance();
        if (!project) throw new Error("No project is currently loaded.");
        project.setMaxBrightness(payload?.percentage);
        await saveLastProject();

        const { ScreenController } = await import("@src/services/hardwareManagement/screen/index.js");
        const screenController = ScreenController.getInstance();
        await screenController.setBrightness(payload?.percentage);

        callback?.({ success: true });
    } catch (error) {
        log.error(`Error setting max brightness: ${(error as Error).message}`);
        callback?.({ success: false, error: (error as Error).message });
    }
}

export default {
    isSignedHarware,
    turnScreenOn,
    turnScreenOff,
    setScreenAutoOffTimeMs,
    setMaxBrightness,
}
