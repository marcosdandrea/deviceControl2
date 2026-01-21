import { isPropietaryHardware } from "../hardwareManagement/utils"
import {Log} from "@src/utils/log"

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
        await screenController.turnOn();
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

export default {
    isSignedHarware,
    turnScreenOn,
    turnScreenOff
}