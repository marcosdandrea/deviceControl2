import crypto from "crypto";
import { app, BrowserWindow } from "electron";
import { Log } from "@src/utils/log.js";
import path from "path";

const log = Log.createInstance("windowManager", true);

export class WindowManager {
    private static instance: WindowManager;
    windows: Map<string, BrowserWindow>;

    constructor() {
        this.windows = new Map<string, BrowserWindow>();

        if (WindowManager.instance) {
            return WindowManager.instance;
        }

        WindowManager.instance = this;
    }

    static getInstance(): WindowManager {
        if (!WindowManager.instance) {
            WindowManager.instance = new WindowManager();
        }
        return WindowManager.instance;
    }

    createWindow(options: { name: string; [key: string]: any, width?: number, height?: number, title?: string }): Promise<BrowserWindow> {
        return new Promise((resolve, reject) => {
            try {
                const {name, width, height} = options
                const id = crypto.randomUUID();
                const window = new BrowserWindow({
                    width: width || 800,
                    height: height || 452,
                    icon: path.join(app.getAppPath(), 'resources', "png", '48x48.png'),
                    show: false,
                    title: options.title || name || "App Window",
                    ...options,
                });
                this.windows.set(id, window);

                window.on('closed', () => {
                    log.info(`Window ${name && id} closed`);
                    this.windows.delete(id);
                });

                window.once('ready-to-show', () => {
                    log.info(`Window ${name && id} is ready to show`);
                    window.show();
                });
                
                resolve(window);
            } catch (e) {
                reject(e);
            }
        });
    }

    getWindow(id: string): BrowserWindow | undefined {
        return this.windows.get(id);
    }

    closeWindow(id: string): void {
        const window = this.windows.get(id);
        if (window) {
            window.close();
              this.windows.delete(id);
        }
    }

    closeAllWindows(): void {
        this.windows.forEach((window) => {
            window.close();
        });
        this.windows.clear();
    }


}