'use strict';
const path = require('path');
const moduleName = path.basename(__dirname);
const dist = path.resolve(__dirname, '../dist', moduleName);

const webpackConfig = {
    context: __dirname,
    entry: {
        'mod1': './js/index.js'
    },
    output: {
        path: dist,
        filename: '[name].[chunkhash].js'
    },
    plugins: []
};

// 继承公共配置
// const defaultsDeep = require('lodash.defaultsdeep');
// const commonConfig = require('../webpack.common');
// defaultsDeep(webpackConfig, commonConfig);

module.exports = webpackConfig;