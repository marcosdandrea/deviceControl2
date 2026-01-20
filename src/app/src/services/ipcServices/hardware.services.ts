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
        const screenController = new ScreenController();
        await screenController.turnOn();
        callback?.(null, true);
    } catch (error) {
        log.error(`Error turning screen on: ${(error as Error).message}`);
        callback?.((error as Error).message, false);
    }
}

const turnScreenOff = async (payload: any, callback: Function): Promise<void> => {
    try {
        const { ScreenController } = await import("@src/services/hardwareManagement/screen/index.js");
        const screenController = new ScreenController();
        await screenController.turnOff();
        callback?.(null, true);
    } catch (error) {
        log.error(`Error turning screen off: ${(error as Error).message}`);
        callback?.((error as Error).message, false);
    }
}   

export default {
    isSignedHarware,
    turnScreenOn,
    turnScreenOff
}