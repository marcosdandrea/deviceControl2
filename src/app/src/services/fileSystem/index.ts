import { promises as fs } from 'fs';
import { Log } from '@src/utils/log';

const log = new Log('FileSystemService');

export const writeFile = async (filePath: string, content: string): Promise<void> => {
    log.info(`Writing to file: ${filePath}`);
    try {
        await fs.writeFile(filePath, content, 'utf8');
        log.info(`File written successfully: ${filePath}`);
    } catch (error) {
        log.error(`Error writing file ${filePath}:`, error);
        throw error;
    }
}

export const readFile = async (filePath: string): Promise<string> => {
    log.info(`Reading file: ${filePath}`);
    try {
        const content = await fs.readFile(filePath, 'utf8');
        log.info(`File read successfully: ${filePath}`);
        return content;
    } catch (error) {
        log.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}