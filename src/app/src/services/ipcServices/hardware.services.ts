import { isPropietaryHardware } from "../hardwareManagement/utils"

const isSignedHarware = (payload: any, callback: Function): boolean => {
    const result = isPropietaryHardware() ? true : false;
    callback?.(result);
    return result;
}

export default {
    isSignedHarware
}