import updateService from "@src/services/update";

export const checkForUpdates = async (data: { includePrerelease?: boolean } | null, cb: Function) => {
    try {
        const result = await updateService.checkForUpdates(Boolean(data?.includePrerelease));
        cb({ success: true, data: result });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
};

export const getUpdateStatus = async (_data: null, cb: Function) => {
    try {
        const data = await updateService.getUpdateStatus();
        cb({ success: true, data });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
};

export const installUpdate = async (_data: null, cb: Function) => {
    try {
        const data = await updateService.installUpdate();
        cb({ success: true, data });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
};

export const rollbackUpdate = async (_data: null, cb: Function) => {
    try {
        const data = await updateService.rollbackUpdate();
        cb({ success: true, data });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
};

export default {
    checkForUpdates,
    getUpdateStatus,
    installUpdate,
    rollbackUpdate,
};
