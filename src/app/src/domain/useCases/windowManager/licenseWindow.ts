
export const showLicenseWindow = async (electronApp: Electron.App): Promise<void> => {
  return new Promise<void>(async (resolve) => {
    const { WindowManager } = await import('@src/services/windowManager/index.js');
    const windowManager = WindowManager.getInstance();

    const licenseWindow = await windowManager.createWindow({
      name: 'License Window',
      width: 400,
      height: 300,
      resizable: false,
      minimizable: false,
      maximizable: false,
      webPreferences: {
        preload: path.join(electronApp.getAppPath(), 'dist-electron', 'preload-license.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const indexPath = path.join(electronApp.getAppPath(), 'dist-electron', 'license.html');
    await licenseWindow.loadFile(indexPath);

    // Listen for the license submission event from the renderer process
    ipcMain.once('submit-license', async (event, licenseKey: string) => {
      const { setSystemLicense } = await import('@src/services/licensing/index.js');
      const success = await setSystemLicense(licenseKey);