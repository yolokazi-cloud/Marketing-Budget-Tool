const path = require('path');

module.exports = function override(webpackConfig) {
  // Find the HtmlWebpackPlugin and change its template path
  const htmlWebpackPlugin = webpackConfig.plugins.find(
    (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin'
  );

  if (htmlWebpackPlugin) {
    htmlWebpackPlugin.userOptions.template = path.resolve(__dirname, 'index.html');
  }

  return webpackConfig;
};
