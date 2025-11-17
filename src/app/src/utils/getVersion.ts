import { isDev } from '.';
import { Log } from "@src/utils/log.js";

const log = Log.createInstance("getVersion", true);

// Obtener la versión del package.json
export const getVersion = async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // En modo desarrollo, el package.json está en el directorio raíz del proyecto
        // Necesitamos subir varios niveles desde la ubicación actual del archivo
        let packagePath;
        if (isDev()) {
            // Desde windowManager/index.ts subir hasta la raíz
            packagePath = path.resolve(__dirname, '../../../../../package.json');
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
                'D:\\Proyecciones\\deviceControl\\package.json',
                path.join(__dirname, '../../../../../../package.json'),
                path.join(process.cwd(), 'package.json')
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