import { LocalizationManager } from "../hardwareManagement/Localization";
import { assertLinuxFeature } from "@src/utils/index.js";
import { Project } from "@src/domain/entities/project";
import { saveLastProject } from "@src/domain/useCases/project";
import { Log } from "@src/utils/log";

const log = Log.createInstance("Localization Services", true);

const localizationManager = LocalizationManager.getInstance();

export const getCurrentTimezone = async (_data: null, cb: Function) => {
    try {
        assertLinuxFeature("Configuración de zona horaria");
        const timezoneInfo = await localizationManager.getCurrentTimezone();
        cb({ success: true, data: timezoneInfo });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}

export const setTimezone = async (data: { timezone: string }, cb: Function) => {
    try {
        assertLinuxFeature("Configuración de zona horaria");
        const { timezone } = data;
        const success = await localizationManager.setTimezone(timezone);

        if (success) {
            try {
                const project = Project.getInstance();
                if (project) {
                    project.setTimezone(timezone);
                    await saveLastProject();
                }
            } catch (error) {
                log.error(`Error persisting timezone to project: ${(error as Error).message}`);
            }
        }

        cb({ success });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}

export const listAvailableTimezones = async (_data: null, cb: Function) => {
    try {
        assertLinuxFeature("Configuración de zona horaria");
        const timezones = await localizationManager.listAvailableTimezones();
        cb({ success: true, data: timezones });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}

export const validateTimezone = async (data: { timezone: string }, cb: Function) => {
    try {
        assertLinuxFeature("Configuración de zona horaria");
        const { timezone } = data;
        const isValid = await localizationManager.validateTimezone(timezone);
        cb({ success: true, isValid });
    } catch (error) {
        cb({ success: false, error: error?.message || error });
    }
}