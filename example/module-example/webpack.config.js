'use strict';
const path = require('path');
const moduleName = path.basename(__dirname);
const dist = path.resolve(__dirname, '../dist', moduleName);
const AssetsWebpackPlugin = require('ci-task-runner/plugin/webpack');

const webpackConfig = {
    context: __dirname,
    entry: {
        'index': './js/index.js'
    },
    output: {
        path: dist,
        filename: '[name].[chunkhash].js'
    },
    plugins: [new AssetsWebpackPlugin()]
};

module.exports = webpackConfig;