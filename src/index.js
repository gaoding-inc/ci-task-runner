'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const childProcess = require('child_process');
const gulp = require('gulp');
const rename = require('gulp-rename');
const fsp = require('fs-promise');
const numCPUs = require('os').cpus().length;
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('./lib/promise-task');
const webpackWorker = require('./webpack-worker');
const dirtyChecking = require('./dirty-checking');
const promiseify = require('./lib/promiseify');

const ASSETS_DEFAULT_NAME = './config/assets.default.json';
const ASSETS_DEFAULT_PATH = path.join(__dirname, ASSETS_DEFAULT_NAME);
const GIT_WEBPACK_DEFAULT = require('./config/git-webpack.default.json');
const ASSETS_DEFAULT = require(ASSETS_DEFAULT_NAME);
const access = promiseify(fs.access, fs);
const MODULE_NAME_REG = /(\${moduleName})/g;



/**
 * @param   {Object[]|string[]} modules         模块目录列表
 * @param   {Object}            modules.name           模块目录名（相对）
 * @param   {string[]}          modules.dependencies   模块依赖目录（相对）
 * @param   {string[]}          dependencies           模块组公共依赖（相对）
 * @param   {string}            assets          构建后文件索引表输出路径（相对）
 * @param   {string[]}          dependencies    模块依赖（相对）
 * @param   {number}            parallel        Webpack: 最大进程数
 * @param   {number}            timeout         Webpack: 单个任务超时
 * @param   {string}            cwd             Webpack: 工作目录
 * @param   {string[]}          argv            Webpack: 设置启动执行 webpack.config.js 的命令行参数
 * @param   {Object}            evn             Webpack: 设置环境变量
 * @param   {string}            launch          Webpack: 启动文件
 * @param   {boolean}           force           是否强制全量编译
 * @param   {string}            context         git-webpack 工作目录（绝对路径）
 */
module.exports = function(options = {}, context = process.cwd()) {

    options = defaultsDeep({}, options, GIT_WEBPACK_DEFAULT);

    let {modules, dependencies, assets, parallel} = options;
    let {force, timeout, cwd, env, argv, launch} = options.build;

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
                dependencies,
                force,
                context
            });


            let tasks = dirtyList.map(({name, version}) => () => {

                let webpackLaunch = launch.replace(MODULE_NAME_REG, name);
                let webpackConfigPath = path.join(context, webpackLaunch);
                let webpackContext = path.dirname(webpackConfigPath);
                let webpackCwd = path.join(context, cwd.replace(MODULE_NAME_REG, name));
                let CMD = `node --print "require.resolve('webpack')"`;
                let webpackPath = childProcess.execSync(CMD, { cwd: webpackContext }).toString().trim();

                // 多进程运行 webpack，加速编译
                return webpackWorker({
                    webpackPath,
                    webpackConfigPath,
                    webpackContext,
                    cwd: webpackCwd,
                    env,
                    argv,
                    timeout
                }).then(stats => {
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
            resources.modules = modules;
            return resources;
        },


        // 保存当前编译结果
        // 重新读取文件，避免因为多实例运行 git-webpack 导致配置意外覆盖的情况
        resources => assets ? fsp.readFile(assets, 'utf8')
            .then(jsonText => {
                let oldJson = JSON.parse(jsonText);
                let version = (Number(oldJson.version) || 0) + 1;
                let newJson = defaultsDeep({version}, resources, oldJson);
                let newJsonText = JSON.stringify(newJson, null, 2);
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
                console.log(JSON.stringify(resources, null, 2));
            }
        }

    ]).catch(errors => process.nextTick(() => {
        throw errors;
    }));
};
