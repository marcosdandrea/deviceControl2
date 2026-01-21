import { LocalizationManager } from "../hardwareManagement/Localization";

const localizationManager = LocalizationManager.getInstance();

export const getCurrentTimezone = async (_data: null, cb: Function) => {
    try {
        const timezoneInfo = await localizationManager.getCurrentTimezone();
        cb({ success: true, data: timezoneInfo });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}

export const setTimezone = async (data: { timezone: string }, cb: Function) => {
    try {
        const { timezone } = data;
        const success = await localizationManager.setTimezone(timezone);
        cb({ success });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}

export const listAvailableTimezones = async (_data: null, cb: Function) => {
    try {
        const timezones = await localizationManager.listAvailableTimezones();
        cb({ success: true, data: timezones });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}

export const validateTimezone = async (data: { timezone: string }, cb: Function) => {
    try {
        const { timezone } = data;
        const isValid = await localizationManager.validateTimezone(timezone);
        cb({ success: true, isValid });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}