'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const fsp = require('fs-promise');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('./lib/promise-task');
const webpackRenner = require('./webpack-runner');
const dirtyChecking = require('./dirty-checking');
const getBuildVersion = require('./get-build-version');


const WEBPACK_CONFIG_NAME = 'webpack.config.js';
const GIT_WEBPACK_DEFAULT = require('./defaults.json');

const ASSETS_DEFAULT = {
    "modified": null,
    "version": null,
    "modules": {}
};

module.exports = function ({
    modules = GIT_WEBPACK_DEFAULT.modules,
    assets = GIT_WEBPACK_DEFAULT.assets,
    dependencies = GIT_WEBPACK_DEFAULT.dependencies,
    parallel = GIT_WEBPACK_DEFAULT.parallel,
    force = false,
    webpackCliArgs = '',
    context = process.cwd(),
    debug = false
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

                    let basic = path.join(context, name);
                    let webpackConfigPath = path.join(basic, WEBPACK_CONFIG_NAME);

                    // 多进程运行 webpack，加速编译
                    return webpackRenner(webpackConfigPath, webpackCliArgs).then(data => {

                        let mod = {
                            modified: (new Date()).toISOString(),
                            version: version,
                            chunks: {},
                            assets: []
                        };

                        Object.keys(data.assetsByChunkName).forEach(name => {
                            let file = data.assetsByChunkName[name];

                            // 如果开启 devtool 后，可能输出 source-map 文件
                            file = Array.isArray(file) ? file[0] : file;

                            mod.chunks[name] = file;
                        });

                        mod.assets = data.assets.map(asset => {
                            let file = asset.name;
                            return file;
                        });

                        resources.modules[name] = mod;
                    });
                };
            });


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
