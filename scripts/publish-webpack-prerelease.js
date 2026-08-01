#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline/promises');
const { execSync, execFileSync } = require('child_process');
const JSZip = require('jszip');

// Obtener el título del release desde los argumentos
const releaseTitle = process.argv[2];
if (!releaseTitle) {
    console.error('❌ Error: Debe proporcionar un título para el pre-release');
    console.error('Uso: npm run pre:webpack "Título del Pre-Release"');
    process.exit(1);
}

async function askChangelog() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        let changelog = '';
        while (!changelog.trim()) {
            changelog = await rl.question('📝 Describí los cambios de este pre-release (changelog): ');
            if (!changelog.trim()) {
                console.log('⚠️  El changelog no puede estar vacío.');
            }
        }
        return changelog.trim();
    } finally {
        rl.close();
    }
}

async function publishWebpackPreRelease() {
    let notesFilePath;
    try {
        console.log(`📝 Título del pre-release: ${releaseTitle}`);

        const changelog = await askChangelog();

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

        // 6. Crear el pre-release en GitHub
        console.log('🚀 Creando pre-release en GitHub...');
        notesFilePath = path.join(os.tmpdir(), `dc2-prerelease-notes-${Date.now()}.txt`);
        fs.writeFileSync(notesFilePath, `${changelog}\n\nPre-release de Device Control 2 - Webpack Bundle v${version}`, 'utf8');

        try {
            execFileSync('gh', [
                'release', 'create', tag, zipPath,
                '--title', releaseTitle,
                '--notes-file', notesFilePath,
                '--prerelease',
            ], { stdio: 'inherit' });
            console.log('✅ Pre-release creado exitosamente en GitHub!');

            // 7. Limpiar el archivo ZIP local
            fs.unlinkSync(zipPath);
            console.log('🧹 Archivo ZIP local eliminado');

        } catch (error) {
            console.error('❌ Error al crear el pre-release en GitHub:', error.message);
            console.log('💡 El archivo ZIP se ha conservado en:', zipPath);
            process.exit(1);
        }

        console.log('🎉 ¡Proceso de pre-release completado exitosamente!');

    } catch (error) {
        console.error('❌ Error durante el proceso:', error.message);
        process.exit(1);
    } finally {
        if (notesFilePath && fs.existsSync(notesFilePath)) {
            fs.unlinkSync(notesFilePath);
        }
    }
}

publishWebpackPreRelease();
