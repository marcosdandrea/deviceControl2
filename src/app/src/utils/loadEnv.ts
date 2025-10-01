import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import {Log} from '@src/utils/log';
const log = Log.createInstance('loadEnv', true);

const isDevelopment = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

function loadEnv() {
  const isDev = isDevelopment;
  const base = isDev ? process.cwd() : process.resourcesPath;

  // Prioriza .env.local si existe
  const candidates = [
    path.join(base, '.env')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
        log.info(`Environment file loaded from`);
        break;
    } else{
        log.error(`Environment file not found at`);
        throw new Error(`Environment file not found`);
    }
  }


}

loadEnv();