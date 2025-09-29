import { promises as fs } from 'fs';
import { Log } from '@src/utils/log';
import path from "path"
const log = Log.createInstance('FileSystemService');

export const writeFile = async (filePath: string, content: string): Promise<void> => {
    log.info(`Writing to file: ${filePath}`);
    try {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, content, 'utf8');
        log.info(`File written successfully: ${filePath}`);
    } catch (error) {
        log.error(`Error writing file ${filePath}:`, error);
        throw error;
    }
}

export const readFile = async (filePath: string, parse: boolean = true): Promise<object|string> => {
    log.info(`Reading file: ${filePath}`);
    try {
        const content = await fs.readFile(filePath, 'utf8');
        log.info(`File read successfully: ${filePath}`);
        const projectData = parse ? JSON.parse(content) : content;
        return projectData;
    } catch (error) {
        log.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}

export const deleteFile = async (filePath: string): Promise<void> => {
    log.info(`Deleting file: ${filePath}`);
    try {
        await fs.unlink(filePath);
        log.info(`File deleted successfully: ${filePath}`);
    } catch (error) {
        log.error(`Error deleting file ${filePath}:`, error);
        throw error;
    }
}

export const readDirectory = async (dirPath: string): Promise<string[]> => {
    log.info(`Reading directory: ${dirPath}`);
    try {
        const files = await fs.readdir(dirPath);
        log.info(`Directory read successfully: ${dirPath}`);
        return files;
    } catch (error) {
        log.error(`Error reading directory ${dirPath}:`, error);
        throw error;
    }
}

export const clearDirectory = async (dirPath: string): Promise<void> => {
    log.info(`Clearing directory: ${dirPath}`);
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
        await fs.mkdir(dirPath, { recursive: true });
        log.info(`Directory cleared successfully: ${dirPath}`);
    } catch (error) {
        log.error(`Error clearing directory ${dirPath}:`, error);
        throw error;
    }
}

export default {
    writeFile,
    readFile,
    deleteFile,
    readDirectory,
};