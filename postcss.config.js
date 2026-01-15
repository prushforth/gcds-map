module.exports = {
  plugins: [
    require('postcss-import')({
      // Allow importing from node_modules
      resolve: function(id, basedir, importOptions) {
        // Handle node_modules imports
        if (id.startsWith('~')) {
          return require.resolve(id.slice(1));
        }
        // Handle relative paths
        return require('postcss-import/lib/resolve-id')(id, basedir, importOptions);
      }
    })
  ]
};