#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const JSZip = require('jszip');

// Obtener el título del release desde los argumentos
const releaseTitle = process.argv[2];
if (!releaseTitle) {
    console.error('❌ Error: Debe proporcionar un título para el release');
    console.error('Uso: npm run pub:webpack "Título del Release"');
    process.exit(1);
}

async function publishWebpackRelease() {
    try {
        console.log(`📝 Título del release: ${releaseTitle}`);

        // 1. Ejecutar dist:webpack (que incrementa la versión)
        console.log('🔨 Ejecutando script dist:webpack...');
        execSync('npm run dist:webpack', { stdio: 'inherit' });

        // 2. Leer la versión actualizada del package.json
        console.log('📖 Leyendo versión actualizada del package.json...');
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const version = packageJson.version;
        const tag = `v${version}`;
        
        console.log(`🏷️  Versión: ${version}`);
        console.log(`🎯 Tag: ${tag}`);

        // 3. Verificar que existe la carpeta dist/webpack
        const webpackDistPath = path.join(process.cwd(), 'dist', 'webpack');
        if (!fs.existsSync(webpackDistPath)) {
            throw new Error('❌ La carpeta dist/webpack no existe después de ejecutar dist:webpack');
        }

        // 4. Crear el archivo ZIP
        console.log('📦 Creando archivo ZIP...');
        const zip = new JSZip();
        
        function addFolderToZip(folderPath, zipFolder = '') {
            const items = fs.readdirSync(folderPath);
            items.forEach(item => {
                const itemPath = path.join(folderPath, item);
                const zipPath = zipFolder ? `${zipFolder}/${item}` : item;
                
                if (fs.statSync(itemPath).isDirectory()) {
                    addFolderToZip(itemPath, zipPath);
                } else {
                    const fileContent = fs.readFileSync(itemPath);
                    zip.file(zipPath, fileContent);
                }
            });
        }

        addFolderToZip(webpackDistPath, 'webpack');
        
        const zipFileName = 'webpack.zip';
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const zipPath = path.join(process.cwd(), zipFileName);
        fs.writeFileSync(zipPath, zipBuffer);
        
        console.log(`✅ ZIP creado: ${zipFileName}`);

        // 5. Verificar si gh CLI está instalado
        console.log('🔍 Verificando GitHub CLI...');
        try {
            execSync('gh --version', { stdio: 'pipe' });
        } catch (error) {
            throw new Error('❌ GitHub CLI (gh) no está instalado. Instálalo desde: https://cli.github.com/');
        }

        // 6. Crear el release en GitHub
        console.log('🚀 Creando release en GitHub...');
        const createReleaseCmd = `gh release create "${tag}" "${zipPath}" --title "${releaseTitle}" --notes "Release automático de Device Control 2 - Webpack Bundle v${version}"`;
        
        try {
            execSync(createReleaseCmd, { stdio: 'inherit' });
            console.log('✅ Release creado exitosamente en GitHub!');
            
            // 7. Limpiar el archivo ZIP local
            fs.unlinkSync(zipPath);
            console.log('🧹 Archivo ZIP local eliminado');
            
        } catch (error) {
            console.error('❌ Error al crear el release en GitHub:', error.message);
            console.log('💡 El archivo ZIP se ha conservado en:', zipPath);
            process.exit(1);
        }

        console.log('🎉 ¡Proceso completado exitosamente!');
        
    } catch (error) {
        console.error('❌ Error durante el proceso:', error.message);
        process.exit(1);
    }
}

publishWebpackRelease();