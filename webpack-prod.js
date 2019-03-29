const webpackMerge = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./webpack-common');

module.exports = webpackMerge(webpackCommon, {
  mode: 'production',
  entry: {
    zero: './src/events.js',
  },
  watch: false,
  output: {
    filename: 'zero-events.js',
    path: path.resolve(__dirname, 'build'),
    libraryTarget: 'umd',
    library: 'ZeroEvents',
    umdNamedDefine: true,
    globalObject: 'this',
  },
});
