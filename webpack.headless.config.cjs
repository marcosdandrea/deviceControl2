const path = require('path');
const { DefinePlugin } = require('webpack');
const JavaScriptObfuscator = require('webpack-obfuscator');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: path.resolve(__dirname, 'src/app/main.ts'),
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist/webpack'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    },
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
      '@src': path.resolve(__dirname, 'src/app/src'),
      '@utils': path.resolve(__dirname, 'src/app/src/utils'),
      '@assets': path.resolve(__dirname, 'src/app/src/assets'),
      '@domain': path.resolve(__dirname, 'src/app/src/domain'),
      '@services': path.resolve(__dirname, 'src/app/src/services'),
      '@entities': path.resolve(__dirname, 'src/app/src/domain/entities'),
      '@useCases': path.resolve(__dirname, 'src/app/src/domain/useCases'),
      '@root': path.resolve(__dirname, '.'),
    },
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, 'tsconfig-electron.json'),
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: path.resolve(__dirname, 'tsconfig-electron.json'),
          transpileOnly: true,
        },
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    electron: 'commonjs2 electron',
  },
  externalsPresets: { node: true },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.HEADLESS': JSON.stringify('true'),
    }),
    new JavaScriptObfuscator(
      {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: false,
        identifierNamesGenerator: 'mangled',
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.75,
      },
      []
    ),
  ],
  optimization: {
    minimize: true,
  },
  devtool: false,
  experiments: {
    topLevelAwait: true,
  },
};
