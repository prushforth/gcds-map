import {defineCustomElements} from '../dist/esm/loader';

import gcdsTheme from './gcds-theme';

defineCustomElements();

const preview = {
  parameters: {
    docs: {
      // source: {
      //   state: 'open',
      // },
      theme: gcdsTheme,
    },
  },
};

export default preview;
