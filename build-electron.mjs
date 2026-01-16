import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

build({
    entryPoints: {
        main: 'src/app/main.ts',
        preload: 'src/app/src/domain/useCases/windowManager/preload.ts'
    },
    outdir: 'dist-electron',
    entryNames: '[name]',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    alias: {
        '@common': './src/common',
        '@src': './src/app/src',
        '@utils': './src/app/src/utils',
        '@assets': './src/app/src/assets',
        '@domain': './src/app/src/domain',
        '@services': './src/app/src/services',
        '@entities': './src/app/src/domain/entities',
        '@useCases': './src/app/src/domain/useCases',
    },
    external: [
        'electron',
        'fs',
        'path',
        'os',
        'url',
        'dotenv/config'
    ]
}).then(() => {
    // Copiar scripts de PowerShell a dist-electron
    const scriptsDir = join('dist-electron', 'scripts');
    if (!existsSync(scriptsDir)) {
        mkdirSync(scriptsDir, { recursive: true });
    }
    
    copyFileSync('resources/scripts/ps.GetAllEthernetConfigs.ps1', join(scriptsDir, 'ps.GetAllEthernetConfigs.ps1'));
    copyFileSync('resources/scripts/ps.OnEventSuscribe.ps1', join(scriptsDir, 'ps.OnEventSuscribe.ps1'));
    
    console.log('✓ PowerShell scripts copied to dist-electron/scripts');
}).catch(() => process.exit(1));
