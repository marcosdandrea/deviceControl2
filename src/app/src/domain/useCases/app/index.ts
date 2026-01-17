import App from "@domain/entities/app/index.js"
import { Log } from "@utils/log.js"
import path from "node:path"
const log = Log.createInstance("appUseCase", true)

const isHeadless = process.argv.includes('--headless') || process.argv.includes('--h') || process.env.HEADLESS === 'true';

// Resolve resources both in dev and in production
const resolveResource = async (...segments: string[]) => {
  if (isHeadless) {
    // In headless mode, resources are in the cwd/resources directory
    return path.join(process.cwd(), "resources", ...segments);
  }
  
  const { app } = await import("electron");
  if (app.isPackaged) {
    // electron-builder places extraResources under process.resourcesPath
    return path.join((process as any).resourcesPath, ...segments)
  }
  // dev: read from project /resources
  return path.join(process.cwd(), "resources", ...segments)
}

export const createApp = async () => {
    try {
        App.getInstance()
        
        // Skip Electron-specific setup in headless mode
        if (isHeadless) {
          log.info("App created successfully (headless mode)");
          return;
        }
        
        const { app, nativeImage } = await import("electron");
        
        // Prefer .icns on macOS; fallback to PNG if missing
        const macIcnsPath = await resolveResource("icons", "mac", "icon.icns")
        const macPngFallback = await resolveResource("png", "512x512.png")
        if (process.platform === "darwin") {
          let img = nativeImage.createFromPath(macIcnsPath)
          if (img.isEmpty()) {
            img = nativeImage.createFromPath(macPngFallback)
          }
          if (!img.isEmpty()) {
            try { app.dock.setIcon(img) } catch {}
          }
        }
        // Force a writable CWD to avoid relative-writes breaking when launched via Finder / App Translocation
        try { process.chdir(app.getPath('userData')); } catch {}
        // Ensure logs go to a writable place
        try { app.setAppLogsPath(app.getPath('logs')); } catch {}
        // Diagnostics to compare Finder vs Terminal launches
        const execPath = process.execPath;
        const isTranslocated = execPath.includes('/AppTranslocation/');
        log.info('[paths]', {
          userData: app.getPath('userData'),
          logs: app.getPath('logs'),
          cwd: process.cwd(),
          execPath,
          isTranslocated
        });
        log.info("App created successfully")
    } catch (error) {
        log.error("Error creating App instance:", error);
    }
}

export const closeApp = () => {
    try {
        log.info("App closed successfully")
    } catch (error) {
        log.error("Error closing App instance:", error);
    }
}

export const getAppVersion = () => {
    return { version: App.getAppVersion() };
}

export default {
    createApp,
    closeApp,
    getAppVersion
}