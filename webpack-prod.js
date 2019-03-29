const webpackMerge = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./webpack-common');

module.exports = webpackMerge(webpackCommon, {
  mode: 'production',
  entry: {
    abide: './src/abide.js',
  },
  watch: false,
  output: {
    filename: 'abide.js',
    path: path.resolve(__dirname, 'build'),
    libraryTarget: 'umd',
    library: 'Abide',
    umdNamedDefine: true,
    globalObject: 'this',
  },
});
