import path from 'path';
import { app } from 'electron';
import { isDev } from '@utils/index.js';
import { pathToFileURL } from 'url';


export function getPreloadPath() {
  return path.join(app.getAppPath(), isDev() ? '.' : '..', 'dist-app/app/src/utils/preload.cjs');
}

export function getUIPath() {
  const filePath = path.join(app.getAppPath(), 'dist-react', 'index.html');
  return pathToFileURL(filePath).toString();
}

export function getAssetPath() {
  return path.join(app.getAppPath(), isDev() ? '.' : '..', '/src/assets');
}
