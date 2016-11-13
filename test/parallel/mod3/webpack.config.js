'use strict';
const path = require('path');
const moduleName = path.basename(__dirname);
const dist = path.join(__dirname, '../dist', moduleName);
const GIT_WEBPACK = process.env.GIT_WEBPACK;

const webpack = require('webpack');
const uglify = new webpack.optimize.UglifyJsPlugin({
    compress: {
        warnings: false
    }
});

const webpackConfig = {
    context: __dirname,
    entry: {
        'index': './index.js'
    },
    output: {
        path: dist,
        filename: '[name].[chunkhash].js'
    },
    plugins: [
        GIT_WEBPACK ? uglify : function () { },
        function () {
            this.plugin('done', function (stats) {
                if (!GIT_WEBPACK) {
                    console.log(moduleName, 'done');
                }
            });
        }]
};

// 继承公共配置
// const defaultsDeep = require('lodash.defaultsdeep');
// const commonConfig = require('../webpack.common');
// defaultsDeep(webpackConfig, commonConfig);

module.exports = webpackConfig;