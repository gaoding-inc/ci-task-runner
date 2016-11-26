'use strict';

const path = require('path');
const worker = require('../lib/worker');

class AssetsWebpackPlugin {
    apply(compiler) {
        compiler.plugin('done', stats => {
            let data = stats.toJson();
            let errors = data.errors;

            if (errors.length > 0) {
                // 报告第一个错误
                errors = errors[0];
                throw new Error(errors);
            }


            let hash = data.hash;
            let output = stats.compilation.outputOptions.path.replace(/\[hash\]/g, hash);

            let result = {
                chunks: {},
                assets: []
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

            worker.send(result);
        });
    }
};


if (process.env.$GIT_WEBPACK) {
    module.exports = AssetsWebpackPlugin;
} else {
    module.exports = () => {
        this.apply = () => { };
    };
}