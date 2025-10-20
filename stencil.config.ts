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
        },
        // Copy test HTML and mapml files to build output so they're accessible via dev server
        {
          src: 'components/gcds-map/test/*.{html,mapml}',
          dest: 'test/gcds-map'
        },
        {
          src: 'components/map-layer/test/*.{html,mapml}',
          dest: 'test/map-layer'
        },
        {
          src: 'components/map-layer/test/events/*.{html,mapml}',
          dest: 'test/map-layer/events'
        },
        {
          src: 'components/map-extent/test/*.{html,mapml}',
          dest: 'test/map-extent'
        },
        // Copy shared test data directory recursively
        {
          src: 'components/test/data',
          dest: 'test/data'
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
        },
        // Copy test HTML and mapml files to build output so they're accessible via dev server
        {
          src: 'components/gcds-map/test/*.{html,mapml}',
          dest: 'test/gcds-map'
        },
        {
          src: 'components/map-layer/test/*.{html,mapml}',
          dest: 'test/map-layer'
        },
        {
          src: 'components/map-layer/test/events/*.{html,mapml}',
          dest: 'test/map-layer/events'
        },
        {
          src: 'components/map-extent/test/*.{html,mapml}',
          dest: 'test/map-extent'
        },
        // Copy shared test data directory recursively
        {
          src: 'components/test/data',
          dest: 'test/data'
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
