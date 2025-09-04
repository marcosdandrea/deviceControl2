import { promises as fs } from 'fs';
import { Log } from '@src/utils/log';
import { projectType } from '@common/types/project.types';
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

export const readFile = async (filePath: string): Promise<projectType> => {
    log.info(`Reading file: ${filePath}`);
    try {
        const content = await fs.readFile(filePath, 'utf8');
        log.info(`File read successfully: ${filePath}`);
        const projectData = JSON.parse(content) as projectType;
        return projectData;
    } catch (error) {
        log.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}