import fs from "node:fs/promises";
import path from "node:path";
import { getUserDataPath } from "@src/utils/paths";

const STATE_FILENAME = "network-state.json";

type NetworkFirstRunState = {
  initialized: boolean;
};

const getStateFilePath = async (): Promise<string> => {
  const userDataPath = await getUserDataPath();
  return path.join(userDataPath, STATE_FILENAME);
};

const readFileIfExists = async (filePath: string): Promise<string | null> => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

export const hasCompletedFirstRun = async (): Promise<boolean> => {
  const content = await readFileIfExists(await getStateFilePath());
  if (!content) return false;

  try {
    return (JSON.parse(content) as NetworkFirstRunState)?.initialized === true;
  } catch {
    return false;
  }
};

export const markFirstRunCompleted = async (): Promise<void> => {
  const state: NetworkFirstRunState = { initialized: true };
  await fs.writeFile(await getStateFilePath(), JSON.stringify(state, null, 2), "utf8");
};
