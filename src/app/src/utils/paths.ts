import { existsSync } from "fs";
import { join } from "path";

const isHeadless = process.argv.includes('--headless') || process.argv.includes('--h') || process.env.HEADLESS === 'true'

export const getAppPath = async (): Promise<string> => {
  if (isHeadless) {
    return process.cwd();
  }
  const { app } = await import ("electron")

  return app.getAppPath()
}

export const getUserDataPath = async (): Promise<string> => {
  if (isHeadless) {
    return process.cwd();
  }
  const { app } = await import ("electron")
  return app.getPath("userData");
}

/**
 * Obtiene la ruta del directorio de scripts de PowerShell.
 * En desarrollo: resources/scripts
 * En producción empaquetada: process.resourcesPath/scripts
 * En producción sin empaquetar: dist-electron/scripts
 */
export const getScriptsDir = async (): Promise<string> => {
    if (isHeadless) {
    return join(process.cwd(), "resources", "scripts");
  }
  const { app } = await import ("electron")
  return join(app.getAppPath(), "dist-electron", "scripts");
}