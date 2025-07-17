import { Config } from '@stencil/core';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export const config: Config = {
  namespace: 'gcds-map',
  taskQueue: 'async',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [
        {
          src: 'components/gcds-map/assets',  
          dest: 'gcds-map/assets',
          warn: true
        },
        {
          src: '../node_modules/@maps4html/mapml/dist/mapml.css',
          dest: 'mapml.css',
          warn: true
        },
        {
          src: '../node_modules/@maps4html/mapml/dist/mapml.css',
          dest: '../esm/mapml.css',
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
          src: 'components/gcds-map/gcds-map.css',
          dest: 'build/gcds-map/gcds-map.css'
        },
        {
          src: 'components/gcds-map/assets',
          dest: 'build/gcds-map/assets',
          warn: true
        },
        {
          src: '../node_modules/@maps4html/mapml/dist/mapml.css',
          dest: 'build/mapml.css',
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
