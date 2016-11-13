'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const gulp = require('gulp');
const rename = require('gulp-rename');
const fsp = require('fs-promise');
const numCPUs = require('os').cpus().length;
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('./lib/promise-task');
const webpackWorker = require('./webpack-worker');
const dirtyChecking = require('./dirty-checking');
const getBuildVersion = require('./get-build-version');
const promiseify = require('./lib/promiseify');

const WEBPACK_CONFIG_NAME = 'webpack.config.js';
const ASSETS_DEFAULT_NAME = './config/assets.default.json';
const ASSETS_DEFAULT_PATH = path.join(__dirname, ASSETS_DEFAULT_NAME);
const GIT_WEBPACK_DEFAULT = require('./config/git-webpack.default.json');
const ASSETS_DEFAULT = require(ASSETS_DEFAULT_NAME);
const access = promiseify(fs.access, fs);



/**
 * @param   {Object[]|string[]} modules         模块目录列表
 * @param   {Object}            modules.name           模块名
 * @param   {string[]}          modules.dependencies   模块依赖
 * @param   {string[]}          dependencies           模块组公共依赖
 * @param   {string}            assets          构建后文件索引表输出路径
 * @param   {string[]}          dependencies    模块依赖
 * @param   {number}            parallel        最大 Webpack 进程数
 * @param   {Object}            evn             设置环境变量
 * @param   {boolean}           force           是否强制全量编译
 * @param   {boolean}           debug           调试模式
 * @param   {string}            context         工作目录（绝对路径）
 */
module.exports = function({
    modules = GIT_WEBPACK_DEFAULT.modules,
    assets = GIT_WEBPACK_DEFAULT.assets,
    dependencies = GIT_WEBPACK_DEFAULT.dependencies,
    parallel = GIT_WEBPACK_DEFAULT.parallel,
    env = GIT_WEBPACK_DEFAULT.evn,
    force = false,
    debug = false,
    context = process.cwd()
} = {}) {

    if (assets) {
        assets = path.join(context, assets);
    }

    if (parallel) {
        parallel = Math.max(parallel, numCPUs);
    }

    return promiseTask.serial([


        // 创建文件索引表
        () => assets ? access(assets).catch(() => new Promise((resolve, reject) => {
            let basename = path.basename(assets);

            // 使用 gulp 创建文件可避免目录不存在的问题
            gulp.src(ASSETS_DEFAULT_PATH)
                .pipe(rename(basename))
                .pipe(gulp.dest(path.dirname(assets)))
                .on('end', errors => errors ? reject(errors) : resolve());

        })) : null,


        // 运行 Webpack 任务
        () => {
            let dirtyList = dirtyChecking({
                modules,
                dependencies
            }, context);

            let tasks = dirtyList.map(({name, version}) => () => {

                let modulePath = path.join(context, name);
                let webpackConfigPath = path.join(modulePath, WEBPACK_CONFIG_NAME);

                // 多进程运行 webpack，加速编译
                return webpackWorker(webpackConfigPath, env).then(stats => {
                    stats.$name = name;
                    stats.$version = version;
                    stats.$modified = (new Date()).toISOString();
                    return stats;
                });
            });

            // 并发运行 webpack 任务
            return promiseTask.parallel(tasks, parallel);
        },


        // 解析 Webpack Stats
        (results) => results.map(stats => {
            let name = stats.$name;
            let version = stats.$version;
            var modified = stats.$modified;
            let hash = stats.hash;
            let output = stats.compilation.outputOptions.path.replace(/\[hash\]/g, hash);
            let relative = file => assets ? path.relative(path.dirname(assets), path.join(output, file)) : file;

            let mod = {
                modified: modified,
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

            return mod;
        }),


        // 包装数据
        (modules) => {
            let resources = defaultsDeep({}, ASSETS_DEFAULT);
            resources.modified = (new Date()).toISOString();
            resources.version = getBuildVersion(context);
            resources.modules = modules;
            return resources;
        },


        // 保存当前编译结果
        // 重新读取文件，避免因为多实例运行 git-webpack 导致配置意外覆盖的情况
        resources => assets ? fsp.readFile(assets, 'utf8')
            .then(jsonText => {
                let oldJson = JSON.parse(jsonText);
                let newJson = defaultsDeep(resources, oldJson);
                let newJsonText = JSON.stringify(resources, null, 2);
                return fsp.writeFile(assets, newJsonText, 'utf8').then(() => newJson);
            }) : resources,


        // 显示日志
        resources => {
            if (process.stdout.isTTY) {
                console.log(util.inspect(resources, {
                    colors: true,
                    depth: null
                }));
            } else {
                console.log(resources);
            }
        }

    ]).catch(errors => process.nextTick(() => {
        throw errors;
    }));
};
