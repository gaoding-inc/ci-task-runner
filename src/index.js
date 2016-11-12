'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const fsp = require('fs-promise');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('./lib/promise-task');
const webpackRenner = require('./webpack-worker');
const dirtyChecking = require('./dirty-checking');
const getBuildVersion = require('./get-build-version');


const WEBPACK_CONFIG_NAME = 'webpack.config.js';
const GIT_WEBPACK_DEFAULT = require('./defaults.json');

const ASSETS_DEFAULT = {
    "modified": null,
    "version": null,
    "modules": {}
};

/**
 * @param   {Object[]|string[]} modules         模块目录列表
 * @param   {Object}            modules.name           模块名
 * @param   {string[]}          modules.dependencies   模块依赖
 * @param   {string[]}          dependencies           模块组公共依赖
 * @param   {string}            assets          构建后文件索引表输出路径
 * @param   {string[]}          dependencies    模块依赖
 * @param   {number}            parallel        最大 Webpack 进程数
 * @param   {boolean}           force           是否强制全量编译
 * @param   {boolean}           debug           调试模式
 * @param   {string}            context         工作目录（绝对路径）
 */
module.exports = function ({
    modules = GIT_WEBPACK_DEFAULT.modules,
    assets = GIT_WEBPACK_DEFAULT.assets,
    dependencies = GIT_WEBPACK_DEFAULT.dependencies,
    parallel = GIT_WEBPACK_DEFAULT.parallel,
    force = false,
    debug = false,
    context = process.cwd()
} = {}) {

    if (assets) {
        assets = path.join(context, assets);
    }

    return promiseTask.serial([


        // 读取上一次编译结果
        () => {
            return assets ? fsp.readFile(assets, 'utf8')
                .then(JSON.parse)
                .catch(() => ASSETS_DEFAULT) : ASSETS_DEFAULT;
        },


        // 运行 Webpack 任务
        resources => {
            let list = dirtyChecking({
                modules,
                dependencies
            }, context);



            let dirtyList = list.filter(mod => force || debug || mod.dirty);
            let tasks = list.map(({name, version}) => {
                return () => {

                    let modulePath = path.join(context, name);
                    let webpackConfigPath = path.join(modulePath, WEBPACK_CONFIG_NAME);

                    // 多进程运行 webpack，加速编译
                    return webpackRenner(webpackConfigPath)
                        .then(stats => parseAssets({ name, version, stats }));
                };
            });



            // 解析 Webpack Stats
            function parseAssets({name, version, stats}) {
                let hash = stats.hash;
                let output = stats.compilation.outputOptions.path.replace(/\[hash\]/g, hash);
                
                let relative = file => {
                    if (assets) {
                        file = path.join(output, file);
                        file = path.relative(path.dirname(assets), file);
                    }
                    return file;
                };

                let mod = {
                    modified: (new Date()).toISOString(),
                    version: version,
                    chunks: {},
                    assets: []
                };

                Object.keys(stats.assetsByChunkName).forEach(chunkName => {
                    let file = stats.assetsByChunkName[chunkName];

                    // 如果开启 devtool 后，可能输出 source-map 文件
                    file = Array.isArray(file) ? file[0] : file;
                    mod.chunks[chunkName] = relative(file);
                });

                mod.assets = stats.assets.map(asset => {
                    let file = asset.name;
                    return relative(file);
                });

                resources.modules[name] = mod;
            }


            // 并发运行 webpack 任务
            return promiseTask.parallel(tasks, parallel).then(() => {
                resources.modified = (new Date()).toISOString();
                resources.version = getBuildVersion(context);
                return resources;
            });
        },


        // 保存当前编译结果
        resources => {

            // TODO 创建上级目录
            // TODO 如果存在多个 git-webpack 进程运行，配置文件可能会错乱
            if (assets) {
                let data = JSON.stringify(resources, null, 2);
                return fsp.writeFile(assets, data, 'utf8').then(() => resources);
            } else {
                return resources;
            }

        },


        // 显示日志
        resources => {
            console.log(util.inspect(resources, {
                colors: true,
                depth: null
            }));
        }

    ]).catch(errors => process.nextTick(() => {
        throw errors;
    }));
};
