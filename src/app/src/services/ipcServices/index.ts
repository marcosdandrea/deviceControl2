
// src/electron/ipcHandler.ts
import { ipcMain, WebContents } from 'electron';

// Para guardar una referencia al contenido web (la ventana abierta)
let webContents: WebContents | null = null;

export function setWebContents(contents: WebContents) {
    webContents = contents;
}

export function sendToRenderer(channel: string, data?: any) {
    if (!webContents) {
        console.error('No se ha establecido WebContents.');
        return;
    }
    webContents.send(channel, data);
}

export function onFromRenderer(channel: string, callback: (event: Electron.IpcMainEvent, data: any) => void) {
    ipcMain.on(channel, (event, data) => {
        callback(event, data);
    });
}