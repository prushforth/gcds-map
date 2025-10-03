import { Config } from '@stencil/core';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export const config: Config = {
  namespace: 'gcds-map',
  taskQueue: 'async',
  globalScript: 'src/global/mapml-globals.js',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [
        {
          src: 'components/gcds-map/assets',
          dest: 'assets',
          warn: true
        }
      ],
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
      copy: [
        {
          src: '../node_modules/@cdssnc/gcds-components/dist/gcds',
          dest: 'gcds',
        },
        {
          src: 'components/gcds-map/assets',
          dest: 'build/assets',
          warn: true
        }
      ],
    },
  ],
  extras: {
    enableImportInjection: true,
    experimentalSlotFixes: true,
  },
  testing: {
    browserHeadless: 'shell',
  },
  rollupPlugins: {
    after: [nodePolyfills()],
  },
};
