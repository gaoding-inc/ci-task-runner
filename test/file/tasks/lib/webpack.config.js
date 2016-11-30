'use strict';
const path = require('path');
const moduleName = path.basename(__dirname);
const dist = path.resolve(__dirname, '../dist', moduleName);
const GIT_WEBPACK = process.env.GIT_WEBPACK;

const webpackConfig = {
    context: __dirname,
    entry: {
        'lib': './js/index.js'
    },
    output: {
        path: dist,
        filename: '[name].js'
    },
    plugins: []
};

module.exports = webpackConfig;