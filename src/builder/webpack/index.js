'use strict';

const path = require('path');
const master = require('./master');


module.exports = builder => {

    // 运行 Webpack 并处理返回结果
    return master(builder).then(stats => {

        let hash = stats.hash;
        let output = stats.compilation.outputOptions.path.replace(/\[hash\]/g, hash);

        let result = {
            chunks: {},
            assets: []
        };


        Object.keys(stats.assetsByChunkName).forEach(chunkName => {
            let file = stats.assetsByChunkName[chunkName];

            // 如果开启 devtool 后，可能输出 source-map 文件
            file = Array.isArray(file) ? file[0] : file;
            result.chunks[chunkName] = path.resolve(output, file);
        });


        result.assets = stats.assets.map(asset => {
            let file = asset.name;
            return path.resolve(output, file);
        });


        return result;
    });
};