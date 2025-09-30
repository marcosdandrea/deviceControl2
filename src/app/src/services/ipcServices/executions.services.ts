import path from "path";
import { promises as fs } from "fs";
import fsSync from "fs";
import JSZip from "jszip";
import fileSystem, { readDirectory as readDir, deleteFile as removeFile } from "../fileSystem";
import { Execution } from "@common/types/execution.type";
import projectEvents from "@common/events/project.events";
import { ServerManager } from "../server/serverManager";
import { getUserDataPath } from "@src/utils/paths";



const notifyExecutionsUpdated = async (routineId: string) => {
    try {
        const mainServer = ServerManager.getInstance("main");
        const io = mainServer.getIO();
        io?.emit(projectEvents.executionsUpdated, { routineId });
    } catch (error) {
        console.error("Failed to notify clients about executions update:", error);
    }
};

const getExecutionsList = async ({ routineId }: { routineId: string }, callback: Function) => {
    try {
        let executions: { timestamp: string; executionId: string; }[] = [];

        const logBaseDir = path.join(await getUserDataPath(), "logs");
        const logDirectoryPath = path.join(logBaseDir, "routines");

        const getExecutionDetails = async (routineId: string, file: string) => {
            const filePath = path.join(logDirectoryPath, routineId, `${file}`);
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
            executions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
        const logBaseDir = path.join(await getUserDataPath(), "logs");
        const filePath = path.join(logBaseDir, "routines", routineId, `${executionId}.json`);
        const content = await fileSystem.readFile(filePath);
        callback(content);
    } catch (error) {
        callback({ error });
    }
}

const deleteExecution = async ({ routineId, executionId }: { routineId: string; executionId: string }, callback: Function) => {
    try {
        
        const logBaseDir = path.join(await getUserDataPath(), "logs");
        const filePath = path.join(logBaseDir, "routines", routineId, `${executionId}.json`);
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

        const logBaseDir = path.join(await getUserDataPath(), "logs");
        const routineLogPath = path.join(logBaseDir, "routines", routineId);
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

        const logBaseDir = path.join(await getUserDataPath(), "logs");
        const routineLogPath = path.join(logBaseDir, "routines", routineId);

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

        const logBaseDir = path.join(await getUserDataPath(), "logs");
        const routineLogPath = path.join(logBaseDir, "routines", routineId);

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

export const getLastExecutions = async (count: number): Promise<Buffer> => {
    // This function retrieves the last 'count' executions across all routines in a zip file.
    // It reads all the execution logs from the filesystem across all routines, sorts them by timestamp, and adds them to a zip archive.

    const logBaseDir = path.join(await getUserDataPath(), "logs");
    const routinesLogPath = path.join(logBaseDir, "routines");
    const zip = new JSZip();
    let allExecutions: { routineId: string; fileName: string; timestamp: string; }[] = [];

    try {
        const routineDirs = await fsSync.promises.readdir(routinesLogPath, { withFileTypes: true });

        for (const dirent of routineDirs) {
            if (dirent.isDirectory()) {
                const routineId = dirent.name;
                const routinePath = path.join(routinesLogPath, routineId);
                const files = await fsSync.promises.readdir(routinePath);
                for (const file of files) {
                    if (file.endsWith(".json")) {
                        const filePath = path.join(routinePath, file);
                       const stats = await fsSync.promises.stat(filePath);
                       allExecutions.push({
                           routineId,
                           fileName: file,
                           timestamp: stats.birthtime.toISOString(),
                       });
                    }
                }
            }
        }

        // Sort all executions by timestamp
        allExecutions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Add the latest 'count' executions to the zip
        for (const execution of allExecutions.slice(0, count)) {
            const filePath = path.join(routinesLogPath, execution.routineId, execution.fileName);
            const content = await fsSync.promises.readFile(filePath);
            const executionLog = JSON.parse(content.toString()) as Execution
            const time = new Date(executionLog.log.ts).toISOString().replace(/[:]/g, '-').replace(/[.]/g, '-');
            zip.file(`${executionLog.log.name}/${time}`, content);
        }
    } catch (error) {
        console.error("Error getting last executions:", error);
    }

    return zip.generateAsync({ type: "nodebuffer" });
}

export default {
    getExecutionsList,
    getExecution,
    deleteExecution,
    downloadExecutions,
    getLastExecutions,
    deleteExecutions,
    deleteAllExecutions,
};