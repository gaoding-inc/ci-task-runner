'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseify = require('./lib/promiseify');
const promiseTask = require('./lib/promise-task');

const ARGV = process.argv.slice(2);
const WORK_PATH = process.cwd();
const CONFIG_PATH = path.join(WORK_PATH, 'git-webpack.json');
const CONFIG = defaultsDeep({}, require(CONFIG_PATH), require('./defaults.json'));
const ASSETS_PATH = path.join(WORK_PATH, CONFIG.assets);
const WEBPACK_CONFIG_NAME = 'webpack.config.js';
const FORCE = ARGV.includes('--force');

const readFile = promiseify(fs.readFile, fs);
const writeFile = promiseify(fs.writeFile, fs);
const exec = promiseify(childProcess.exec, childProcess);

const ASSETS_DEFAULT = {
    "modified": null,
    "version": null,
    "modules": {}
};

module.exports = function() {};

module.exports = promiseTask.serial([

    // 运行前置脚本
    () => {
        if (typeof CONFIG.scripts.before === 'string') {
            return exec(CONFIG.scripts.before, {
                pwd: WORK_PATH
            }).then(log => {
                console.log(log);
            });
        }
    },

    // 读取上一次编译结果
    () => {
        return readFile(ASSETS_PATH, 'utf8').then(resources => {
            try {
                resources = JSON.parse(resources);
            } catch (e) {
                resources = ASSETS_DEFAULT;
            }

            return resources;
        }, errors => {
            return ASSETS_DEFAULT;
        });
    },

    // 运行 Webpack 任务
    resources => {

        let tasks = [];
        let mainVersion = getBuildVersion(WORK_PATH);
        let modifies = CONFIG.dependencies.map(f => getBuildVersion(f) !== mainVersion);
        let dependenciesModified = modifies.includes(true);

        CONFIG.modules.forEach(name => {
            let basic = path.join(WORK_PATH, name);
            let webpackConfig = path.join(basic, WEBPACK_CONFIG_NAME);
            let version = getBuildVersion(basic);

            // 如果模块目录没有修改，则忽略编译
            // 如果模块目录外的依赖有修改，则强制编译
            if (!FORCE && !dependenciesModified && version === mainVersion) {
                return;
            }

            tasks.push(() => {

                // 多进程运行 webpack，加速编译
                let params = [...ARGV, '--config ' + webpackConfig];
                return webpackRenner(params)
                    .then(data => {
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
            });
        });


        // 并发运行 webpack 任务
        return promiseTask.parallel(tasks, CONFIG.parallel).then(() => {
            resources.modified = (new Date()).toISOString();
            resources.version = getBuildVersion(WORK_PATH);
            return resources;
        });
    },

    // 保存当前编译结果
    resources => {
        let data = JSON.stringify(resources, null, 2);
        return writeFile(ASSETS_PATH, data, 'utf8').then(() => {
            console.log(util.inspect(resources, {
                colors: true,
                depth: null
            }));
            return resources;
        });
    },

    // 运行后置脚本
    () => {
        if (typeof CONFIG.scripts.after === 'string') {
            return exec(CONFIG.scripts.after, {
                pwd: WORK_PATH
            }).then(log => {
                console.log(log);
            });;
        }
    }

]).catch(errors => process.nextTick(() => {
    throw errors;
}));



/**
 * 获取模块编译版本号
 * @param  {string}  dir 模块目录
 * @return {string}      版本号
 */
function getBuildVersion(dir) {
    return childProcess.execSync('git log --pretty=format:"%h" -1', {
        pwd: dir
    }).toString();
}


/**
 * Webpack 运行器 - 使用子进程启动 Webpack CLI
 * @param   {string[]}  argv    参数
 * @return  {Promise}
 */
function webpackRenner(argv) {

    argv.push('--json');
    let cmd = webpackRenner.cmd;

    if (!cmd) {
        try {
            let bin = require('webpack/package.json').bin;
            let binFile = typeof bin === 'string' ? bin : bin.webpack;
            let dir = path.join('webpack', binFile);
            let resolveFile = require.resolve(dir);
            cmd = webpackRenner.cmd = 'node ' + resolveFile;
        } catch (e) {
            cmd = webpackRenner.cmd = 'webpack';
        }
    }

    cmd = 'export DEPLOY=1 && ' + cmd; // TODO Windows 兼容

    return exec(cmd + ' ' + argv.join(' ')).then(data => {
        let json = data.match(/([\w\W]*?\n)?(\{\n[\w\W]*?\n\})\n?$/);

        if (json) {
            if (json[1]) {
                console.log(json[1]);
            }
            data = json[2];
        }

        return JSON.parse(data);
    });
}
