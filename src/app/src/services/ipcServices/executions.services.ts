import path from "path";
import fileSystem from "../fileSystem";
import { Execution } from "@common/types/execution.type";

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
        callback({ success: true });
    } catch (error) {
        callback({ error });
    }
}

export default {
    getExecutionsList,
    getExecution,
    deleteExecution,
};