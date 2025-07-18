import { dirname, join } from "path";
const config = {
  core: {},
  stories: [
    '../src/**/*.mdx',
    '../stories/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-mdx-gfm"),
    "@storybook/addon-webpack5-compiler-babel",
    "@chromatic-com/storybook"
  ],
  framework: {
    name: getAbsolutePath("@storybook/html-webpack5"),
    options: {},
  },
  staticDirs: [
   { from: '../dist/gcds-map/gcds-map', to: '/dist/gcds-map/gcds-map' },
   { from: '../dist', to: '/dist' }
 ],
  docs: {
    autodocs: false,
    defaultName: 'Stories'
  },
  webpackFinal: async (config) => {
    // First, modify existing CSS rules to exclude mapml.css
    config.module.rules.forEach(rule => {
      if (rule.test && rule.test.toString().includes('css')) {
        rule.exclude = /mapml\.css$/;
      }
    });
    config.module.rules.unshift({
      test: /mapml\.css$/,
      type: 'asset/resource',
      generator: {
        filename: 'mapml.css'  // Ensure it's served as mapml.css
      }
    });
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            transpileOnly: true,
          },
        },
      ],
    });

    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  }
};
export default config;

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
