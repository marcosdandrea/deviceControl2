import { app } from "electron";

export const getAppPath = (): string => {
  return app.getAppPath()
}

export const getUserDataPath = (): string => {
  return app.getPath("userData");
}