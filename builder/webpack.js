'use strict';

const path = require('path');

module.exports = (builder, callback) => {
    const WEBPACK_PATH = builder.path;
    const WEBPACK_CONFIG_PATH = builder.launch;

    const webpack = require(WEBPACK_PATH);
    const options = require(WEBPACK_CONFIG_PATH);

    // webpack 默认配置下，如果 run 发生错误，不会进入错误流程
    options.bail = true;


    let isWebpackCliConfig = options.entry && options.output && typeof options.run !== 'function';
    let compiler = isWebpackCliConfig ? webpack(options) : options;


    compiler.run(function (errors, stats) {
        if (errors) {
            callback(errors);
        } else {

            let data = stats.toJson();
            let errors = data.errors;

            if (errors.length > 0) {
                // 报告第一个错误
                errors = errors[0];
                callback(new Error(errors));
                return;
            }

            let hash = data.hash;
            let output = stats.compilation.outputOptions.path.replace(/\[hash\]/g, hash);

            let result = {
                chunks: {},
                assets: [],
                log: stats.toString({
                    chunks: false,
                    colors: true
                })
            };


            Object.keys(data.assetsByChunkName).forEach(chunkName => {
                let file = data.assetsByChunkName[chunkName];

                // 如果开启 devtool 后，可能输出 source-map 文件
                file = Array.isArray(file) ? file[0] : file;
                result.chunks[chunkName] = path.resolve(output, file);
            });


            result.assets = data.assets.map(asset => {
                let file = asset.name;
                return path.resolve(output, file);
            });


            callback(null, result);

        }
    });
};