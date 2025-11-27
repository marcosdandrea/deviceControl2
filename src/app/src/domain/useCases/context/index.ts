import { clearDirectory } from "@src/services/fileSystem";
import path from "path";
import { Log } from "@src/utils/log";

const log = Log.createInstance("projectUseCases", true);

const isHeadless = process.argv.includes('--headless') || process.argv.includes('--h') || process.env.HEADLESS === 'true';
const isDevelopment = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

const getLogsBasePath = () => {
  if (isHeadless || isDevelopment) {
    return process.cwd();
  }
  return __dirname;
};

export const clearRoutineContext = async ({ routineId }) => {
   await clearDirectory(path.join(getLogsBasePath(), "logs/routines", routineId)).catch(err => {
      log.error(`Failed to clear logs on project close: ${err}`);
   });
};

export const clearProjectContext = async () => {
   await clearDirectory(path.join(getLogsBasePath(), "logs/routines")).catch(err => {
      log.error(`Failed to clear logs on project close: ${err}`);
   });
}