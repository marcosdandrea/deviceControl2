import { isDev } from '.';
import { Log } from "@src/utils/log.js";

const log = Log.createInstance("getVersion", true);

const isHeadless = process.argv.includes('--headless') || process.argv.includes('--h') || process.env.HEADLESS === 'true';

// Obtener la versión del package.json
export const getVersion = async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // En modo desarrollo o headless, el package.json está en el directorio raíz del proyecto
        let packagePath;
        if (isDev() || isHeadless) {
            packagePath = path.join(process.cwd(), 'package.json');
        } else {
            const { app } = await import('electron');
            packagePath = path.join(app.getAppPath(), 'package.json');
        }
        
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const log = Log.createInstance("getVersion", true);
        log.info(`Version read from package.json: ${packageJson.version} (path: ${packagePath})`);
        return packageJson.version;
    } catch (error) {
        const log = Log.createInstance("getVersion", true);
        log.error(`Error reading version from different paths: ${error.message}`);
        // Intentar rutas alternativas
        try {
            const fs = require('fs');
            const path = require('path');
            const alternativePaths = [
                path.join(process.cwd(), 'package.json'),
                path.join(process.cwd(), '..', 'package.json'),
            ];
            
            for (const altPath of alternativePaths) {
                try {
                    if (fs.existsSync(altPath)) {
                        const packageJson = JSON.parse(fs.readFileSync(altPath, 'utf8'));
                        const log = Log.createInstance("getVersion", true);
                        log.info(`Version found in alternative path: ${packageJson.version} (${altPath})`);
                        return packageJson.version;
                    }
                } catch (e) {
                    // Continuar con el siguiente path
                }
            }
        } catch (e) {
            // Fallback final
        }
        return '2.0.x'; // Fallback version
    }
};