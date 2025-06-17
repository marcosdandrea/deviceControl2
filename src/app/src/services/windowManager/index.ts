import crypto from "crypto";
import { BrowserWindow } from "electron";
import { Log } from "@utils/log.js";

const log = new Log("windowManager", true);

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

    createWindow(options: { name: string; [key: string]: any }): Promise<BrowserWindow> {
        return new Promise((resolve, reject) => {
            try {
                const {name} = options
                const id = crypto.randomUUID();
                const window = new BrowserWindow({
                    show: false,
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