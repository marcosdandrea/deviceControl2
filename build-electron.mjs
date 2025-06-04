import { build } from 'esbuild';

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
}).catch(() => process.exit(1));
