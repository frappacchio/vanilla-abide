const webpackMerge = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./webpack-common');

const ENTRIES = {
  manifest: './sample/app.js',
};


module.exports = webpackMerge(webpackCommon, {
  mode: 'development',
  devtool: 'eval',
  watch: true,
  entry: ENTRIES,
  output: {
    filename: '[name].dev.js',
    path: path.resolve(__dirname, 'build'),
    pathinfo: true,
    sourceMapFilename: '[file].js.map',
  },

  devServer: {
    contentBase: path.join(__dirname, './build'),
    compress: false,
    port: 3000,
    hot: false,
    disableHostCheck: true,
    before(App) {
      App.get('/', (req, res) => {
        res.sendFile(`${__dirname}/sample/index.html`);
      });
    },
  },
});
