'use strict';
const path = require('path');
const taskName = path.basename(__dirname);
const dist = path.resolve(__dirname, '../dist', taskName);

const webpackConfig = {
    context: __dirname,
    entry: {
        'index': './js/index.js'
    },
    output: {
        path: dist,
        filename: '[name].js'
    }
};

module.exports = webpackConfig;