'use strict';

const path = require('path');
const master = require('./master');


module.exports = mod => {

    // 运行 Webpack 并处理返回结果
    return master(mod).then(stats => {

        var date = (new Date()).toLocaleString();
        let hash = stats.hash;
        let output = stats.compilation.outputOptions.path.replace(/\[hash\]/g, hash);

        let moduleAssets = {
            name: mod.name,
            version: 1,
            commit: '',
            date: date,
            chunks: {},
            assets: []
        };


        Object.keys(stats.assetsByChunkName).forEach(chunkName => {
            let file = stats.assetsByChunkName[chunkName];

            // 如果开启 devtool 后，可能输出 source-map 文件
            file = Array.isArray(file) ? file[0] : file;
            moduleAssets.chunks[chunkName] = path.join(output, file);
        });


        moduleAssets.assets = stats.assets.map(asset => {
            let file = asset.name;
            return path.join(output, file);
        });


        return moduleAssets;
    });
};