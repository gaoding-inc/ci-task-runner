'use strict';

const path = require('path');
const master = require('./master');


module.exports = module => {

    // 运行 Webpack 并处理返回结果
    return master(module).then(stats => {

        let commit = module.$commit;
        var modified = (new Date()).toISOString();
        let hash = stats.hash;
        let output = stats.compilation.outputOptions.path.replace(/\[hash\]/g, hash);

        let moduleAssets = {
            name: module.name,
            version: 1,
            commit: commit,
            modified: modified,
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