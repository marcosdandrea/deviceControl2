#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const webpackDir = path.join(distDir, 'webpack');

const run = (command, { env = {} } = {}) => {
  execSync(command, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
};

const copyIfExists = async (source, destination) => {
  if (!fs.existsSync(source)) {
    return;
  }

  await fs.promises.cp(source, destination, { recursive: true });
};

(async () => {
  fs.rmSync(webpackDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  run('npm run build:vite');

  run('npx webpack --config webpack.headless.config.cjs', {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HEADLESS: 'true',
    },
  });

  await copyIfExists(path.join(projectRoot, 'dist-react'), path.join(webpackDir, 'dist-react'));
  await copyIfExists(path.join(projectRoot, 'resources'), path.join(webpackDir, 'resources'));

  const envFile = path.join(projectRoot, '.env');
  if (fs.existsSync(envFile)) {
    await fs.promises.copyFile(envFile, path.join(webpackDir, '.env'));
  }

  const splashFile = path.join(projectRoot, 'resources', 'splash', 'splash.png');
  if (fs.existsSync(splashFile)) {
    await fs.promises.copyFile(splashFile, path.join(webpackDir, 'splash.png'));
  }

  console.log('\nHeadless bundle generated at dist/webpack');
})();
