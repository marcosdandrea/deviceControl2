import { promises as fs } from "fs";
import path from "node:path";
import dayjs from "dayjs";
import { getUserDataPath } from "@src/utils/paths";
import { Log } from "@src/utils/log";
import { getLogRetentionDays } from "@src/services/systemSettings";

const log = Log.createInstance("LogCleanupService", true);

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

const listJsonFilesRecursively = async (dir: string): Promise<string[]> => {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") return [];
    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listJsonFilesRecursively(entryPath);
      }
      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    })
  );

  return files.flat();
};

export const cleanupOldLogs = async (): Promise<{ deletedCount: number }> => {
  const retentionDays = await getLogRetentionDays();
  const cutoff = dayjs().subtract(retentionDays, "day");
  const routinesLogPath = path.join(await getUserDataPath(), "logs", "routines");

  const files = await listJsonFilesRecursively(routinesLogPath);
  let deletedCount = 0;

  for (const filePath of files) {
    try {
      const stats = await fs.stat(filePath);
      const createdAt = dayjs(stats.birthtimeMs || stats.ctimeMs || stats.mtimeMs);
      if (createdAt.isBefore(cutoff)) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    } catch (error) {
      log.warn(`Failed to evaluate/delete log file ${filePath}: ${String(error)}`);
    }
  }

  log.info(`Log cleanup finished: ${deletedCount} file(s) older than ${retentionDays} day(s) removed.`);
  return { deletedCount };
};

let dailyCleanupStarted = false;

export const startDailyCleanup = (): void => {
  if (dailyCleanupStarted) return;
  dailyCleanupStarted = true;

  const runCleanup = async () => {
    try {
      await cleanupOldLogs();
    } catch (error) {
      log.error("Error during scheduled log cleanup:", error);
    } finally {
      setTimeout(runCleanup, CHECK_INTERVAL_MS);
    }
  };

  runCleanup();
};

export default {
  cleanupOldLogs,
  startDailyCleanup,
};
