'use strict';

const path = require('path');
const taskRunner = require('../src/index');

class AssetsWebpackPlugin {

    apply(compiler) {
        compiler.plugin('done', stats => {
            let result = this.assets(stats);
            this.postMessage(result);
        });
    }

    postMessage(result) {
        process.nextTick(() => {
            taskRunner.send(result);
        });
    }

    assets(stats) {
        let data = stats.toJson();
        let errors = data.errors;

        if (errors.length > 0) {
            // 报告第一个错误
            // TODO --watch 静默
            errors = errors[0];
            throw new Error(errors);
        }


        let hash = data.hash;
        let outputOptions = stats.compilation.outputOptions;
        let output = outputOptions.path.replace(/\[hash\]/g, hash);

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

        return result;
    }

};


class noopWebpackPlugin {
    apply(){}
}

if (process.env.CI_TASK_RUNNER) {
    module.exports = AssetsWebpackPlugin;
} else {
    module.exports = noopWebpackPlugin;
}