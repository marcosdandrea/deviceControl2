import { isPropietaryHardware } from "../hardwareManagement/utils"
import {Log} from "@src/utils/log"

const log = Log.createInstance('Hardware Services', true);

const isSignedHarware = async (payload: any, callback: Function): Promise<boolean> => {
    const result = await isPropietaryHardware();
    log.info(`isSignedHarware result: ${result}`);
    callback?.(result);
    return result;
}



export default {
    isSignedHarware
}