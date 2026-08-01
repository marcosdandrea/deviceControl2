import fs from "node:fs/promises";
import path from "node:path";
import { getUserDataPath } from "@src/utils/paths";

const STATE_FILENAME = "systemSettings.json";
const DEFAULT_LOG_RETENTION_DAYS = 15;

type SystemSettingsState = {
  logRetentionDays: number;
};

const defaultState = (): SystemSettingsState => ({
  logRetentionDays: DEFAULT_LOG_RETENTION_DAYS,
});

const getStateFilePath = async (): Promise<string> => {
  const userDataPath = await getUserDataPath();
  return path.join(userDataPath, STATE_FILENAME);
};

const readState = async (): Promise<SystemSettingsState> => {
  try {
    const content = await fs.readFile(await getStateFilePath(), "utf8");
    return { ...defaultState(), ...JSON.parse(content) };
  } catch {
    return defaultState();
  }
};

const writeState = async (state: SystemSettingsState): Promise<void> => {
  await fs.writeFile(await getStateFilePath(), JSON.stringify(state, null, 2), "utf8");
};

export const getLogRetentionDays = async (): Promise<number> => {
  const state = await readState();
  return state.logRetentionDays;
};

export const setLogRetentionDays = async (days: number): Promise<void> => {
  if (typeof days !== "number" || !Number.isFinite(days) || days < 1) {
    throw new Error("logRetentionDays must be a positive number");
  }
  const state = await readState();
  await writeState({ ...state, logRetentionDays: days });
};

export default {
  getLogRetentionDays,
  setLogRetentionDays,
};
