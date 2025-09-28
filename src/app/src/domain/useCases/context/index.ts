import { clearDirectory } from "@src/services/fileSystem";
import path from "path";
import { Log } from "@src/utils/log";

const log = Log.createInstance("projectUseCases", true);

export const clearRoutineContext = async ({ routineId }) => {
   await clearDirectory(path.join(__dirname, "../logs/routines", routineId)).catch(err => {
      log.error(`Failed to clear logs on project close: ${err}`);
   });
};

export const clearProjectContext = async () => {
   await clearDirectory(path.join(__dirname, "../logs/routines")).catch(err => {
      log.error(`Failed to clear logs on project close: ${err}`);
   });
}