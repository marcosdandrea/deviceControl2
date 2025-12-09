/**
 * Mock de Electron para modo headless
 * Este archivo proporciona stubs vacíos para las APIs de Electron
 * que no se utilizan en modo headless
 */

export const app = {
  getPath: (name: string) => process.cwd(),
  getVersion: () => '0.0.0',
  getName: () => 'DeviceControl2-Headless',
  quit: () => process.exit(0),
  whenReady: () => Promise.resolve(),
  on: () => {},
  off: () => {},
};

export const BrowserWindow = class {
  constructor() {}
  loadURL() { return Promise.resolve(); }
  on() {}
  once() {}
  webContents = {
    send: () => {},
    on: () => {},
  };
};

export const dialog = {
  showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
  showSaveDialog: () => Promise.resolve({ canceled: true, filePath: '' }),
  showMessageBox: () => Promise.resolve({ response: 0 }),
  showErrorBox: () => {},
};

export const Menu = {
  buildFromTemplate: () => ({}),
  setApplicationMenu: () => {},
};

export const ipcMain = {
  on: () => {},
  once: () => {},
  handle: () => {},
  removeHandler: () => {},
};

export const ipcRenderer = {
  on: () => {},
  once: () => {},
  send: () => {},
  invoke: () => Promise.resolve(),
};

export const shell = {
  openExternal: () => Promise.resolve(),
};

export const nativeImage = {
  createFromPath: () => ({}),
};

export const contextBridge = {
  exposeInMainWorld: () => {},
};

export default {
  app,
  BrowserWindow,
  dialog,
  Menu,
  ipcMain,
  ipcRenderer,
  shell,
  nativeImage,
  contextBridge,
};
