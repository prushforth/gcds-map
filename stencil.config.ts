import { Config } from '@stencil/core';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export const config: Config = {
  namespace: 'component-display',
  globalScript: 'src/global/global-scripts.ts',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [
        {
          src: '../node_modules/@maps4html/mapml/dist',
          dest: 'gcds-map',
        },
        {
          src: 'components/gcds-map/gcds-map.css', 
          dest: 'gcds-map/gcds-map.css'
        },
        {
          src: 'components/gcds-map/assets',  
          dest: 'gcds-map/assets',
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
          src: '../node_modules/@maps4html/mapml/dist',
          dest: 'build/gcds-map',
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
          src: 'components/gcds-map/test/*.html',
          dest: 'components/gcds-map/test'
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
