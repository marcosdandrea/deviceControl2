import path from "path";
import { promises as fs } from "fs";
import JSZip from "jszip";
import fileSystem, { readDirectory as readDir, deleteFile as removeFile } from "../fileSystem";
import { Execution } from "@common/types/execution.type";
import projectEvents from "@common/events/project.events";
import { ServerManager } from "../server/serverManager";

const notifyExecutionsUpdated = async (routineId: string) => {
    try {
        const mainServer = ServerManager.getInstance("main");
        const io = mainServer.getIO();
        io?.emit(projectEvents.executionsUpdated, { routineId });
    } catch (error) {
        console.error("Failed to notify clients about executions update:", error);
    }
};

const logDirectory = '/logs';

const getExecutionsList = async ({ routineId }: { routineId: string }, callback: Function) => {
    try {
        let executions: { timestamp: string; executionId: string; }[] = [];

        const logDirectoryPath = path.join(__dirname, "..", logDirectory, "routines");

        const getExecutionDetails = async (routineId: string, file: string) => {
            const filePath = path.join(logDirectoryPath, routineId, `${file}`);
            console.log("Reading file:", filePath);
            const content = await fileSystem.readFile(filePath) as Execution;
            return {
                origin: content.triggeredBy.type || "unknown",
                timestamp: content.log.ts,
                executionId: content.executionId,
            };
        };

        const getRoutineExecutions = async (routineId: string) => {
            const routineLogPath = path.join(logDirectoryPath, routineId);
            const files = await fileSystem.readDirectory(routineLogPath);
            return await Promise.all(files.map(file => getExecutionDetails(routineId, file)));
        }

        if (routineId) {
            executions = await getRoutineExecutions(routineId);
            callback(executions);
        } else {
            callback({ error: "Routine ID is required to fetch executions." });
        }

    } catch (error) {
        console.error("Error getting executions list:", error);
        callback({ error });
    }
}

const getExecution = async ({ routineId, executionId }: { routineId: string; executionId: string }, callback: Function) => {
    try {
        console.log("Reading execution:", routineId, executionId);
        const filePath = path.join(__dirname, "..", logDirectory, "routines", routineId, `${executionId}.json`);
        const content = await fileSystem.readFile(filePath);
        callback(content);
    } catch (error) {
        callback({ error });
    }
}

const deleteExecution = async ({ routineId, executionId }: { routineId: string; executionId: string }, callback: Function) => {
    try {
        const filePath = path.join(__dirname, "..", logDirectory, "routines", routineId, `${executionId}.json`);
        await fileSystem.deleteFile(filePath);
        await notifyExecutionsUpdated(routineId);
        callback({ success: true });
    } catch (error) {
        callback({ error });
    }
}

const downloadExecutions = async (
    { routineId, executionIds }: { routineId: string; executionIds: string[] },
    callback: Function,
) => {
    try {
        if (!routineId) {
            callback({ error: "Routine ID is required to download executions." });
            return;
        }
        if (!executionIds || executionIds.length === 0) {
            callback({ error: "No executions provided to download." });
            return;
        }

        const routineLogPath = path.join(__dirname, "..", logDirectory, "routines", routineId);
        const zip = new JSZip();

        await Promise.all(executionIds.map(async executionId => {
            const filePath = path.join(routineLogPath, `${executionId}.json`);
            const content = await fs.readFile(filePath);
            zip.file(`${executionId}.json`, content);
        }));

        const archive = await zip.generateAsync({ type: "nodebuffer" });

        callback({
            success: true,
            data: archive.toString("base64"),
            fileName: `${routineId}-executions.zip`,
        });
    } catch (error) {
        console.error("Error downloading executions:", error);
        callback({ error });
    }
}

const deleteExecutions = async (
    { routineId, executionIds }: { routineId: string; executionIds: string[] },
    callback: Function,
) => {
    try {
        if (!routineId) {
            callback({ error: "Routine ID is required to delete executions." });
            return;
        }
        if (!executionIds || executionIds.length === 0) {
            callback({ error: "No executions provided to delete." });
            return;
        }

        const routineLogPath = path.join(__dirname, "..", logDirectory, "routines", routineId);

        await Promise.all(executionIds.map(async executionId => {
            const filePath = path.join(routineLogPath, `${executionId}.json`);
            await fileSystem.deleteFile(filePath);
        }));

        await notifyExecutionsUpdated(routineId);

        callback({ success: true });
    } catch (error) {
        console.error("Error deleting executions:", error);
        callback({ error });
    }
}

const deleteAllExecutions = async (
    { routineId }: { routineId: string },
    callback: Function,
) => {
    try {
        if (!routineId) {
            callback({ error: "Routine ID is required to delete executions." });
            return;
        }

        const routineLogPath = path.join(__dirname, "..", logDirectory, "routines", routineId);

        let files: string[] = [];
        try {
            files = await readDir(routineLogPath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                await notifyExecutionsUpdated(routineId);
                callback({ success: true });
                return;
            }
            throw error;
        }

        const jsonFiles = files.filter(file => file.endsWith(".json"));

        await Promise.all(jsonFiles.map(async file => {
            const filePath = path.join(routineLogPath, file);
            await removeFile(filePath);
        }));

        await notifyExecutionsUpdated(routineId);

        callback({ success: true });
    } catch (error) {
        console.error("Error deleting all executions:", error);
        callback({ error });
    }
}

const downloadExecutions = async (
    { routineId, executionIds }: { routineId: string; executionIds: string[] },
    callback: Function,
) => {
    try {
        if (!routineId) {
            callback({ error: "Routine ID is required to download executions." });
            return;
        }
        if (!executionIds || executionIds.length === 0) {
            callback({ error: "No executions provided to download." });
            return;
        }

        const routineLogPath = path.join(__dirname, "..", logDirectory, "routines", routineId);
        const zip = new JSZip();

        await Promise.all(executionIds.map(async executionId => {
            const filePath = path.join(routineLogPath, `${executionId}.json`);
            const content = await fs.readFile(filePath);
            zip.file(`${executionId}.json`, content);
        }));

        const archive = await zip.generateAsync({ type: "nodebuffer" });

        callback({
            success: true,
            data: archive.toString("base64"),
            fileName: `${routineId}-executions.zip`,
        });
    } catch (error) {
        console.error("Error downloading executions:", error);
        callback({ error });
    }
}

const deleteExecutions = async (
    { routineId, executionIds }: { routineId: string; executionIds: string[] },
    callback: Function,
) => {
    try {
        if (!routineId) {
            callback({ error: "Routine ID is required to delete executions." });
            return;
        }
        if (!executionIds || executionIds.length === 0) {
            callback({ error: "No executions provided to delete." });
            return;
        }

        const routineLogPath = path.join(__dirname, "..", logDirectory, "routines", routineId);

        await Promise.all(executionIds.map(async executionId => {
            const filePath = path.join(routineLogPath, `${executionId}.json`);
            await fileSystem.deleteFile(filePath);
        }));

        callback({ success: true });
    } catch (error) {
        console.error("Error deleting executions:", error);
        callback({ error });
    }
}

const deleteAllExecutions = async (
    { routineId }: { routineId: string },
    callback: Function,
) => {
    try {
        if (!routineId) {
            callback({ error: "Routine ID is required to delete executions." });
            return;
        }

        const routineLogPath = path.join(__dirname, "..", logDirectory, "routines", routineId);

        let files: string[] = [];
        try {
            files = await readDir(routineLogPath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                callback({ success: true });
                return;
            }
            throw error;
        }

        const jsonFiles = files.filter(file => file.endsWith(".json"));

        await Promise.all(jsonFiles.map(async file => {
            const filePath = path.join(routineLogPath, file);
            await removeFile(filePath);
        }));

        callback({ success: true });
    } catch (error) {
        console.error("Error deleting all executions:", error);
        callback({ error });
    }
}

export default {
    getExecutionsList,
    getExecution,
    deleteExecution,
    downloadExecutions,
    deleteExecutions,
    deleteAllExecutions,
};