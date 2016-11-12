'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const fsp = require('fs-promise');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('./lib/promise-task');

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
                .catch(() => ASSETS_DEFAULT) : () => { };
        },


        // 运行 Webpack 任务
        resources => {

            let tasks = [];
            let mainVersion = getBuildVersion(context);
            let modifies = dependencies.map(f => getBuildVersion(f) !== mainVersion);
            let dependenciesModified = modifies.includes(true);

            modules.forEach(name => {
                let basic = path.join(context, name);
                let webpackConfigPath = path.join(basic, WEBPACK_CONFIG_NAME);
                let version = getBuildVersion(basic);

                // 如果模块目录没有修改，则忽略编译
                // 如果模块目录外的依赖有修改，则强制编译
                if (!debug && !force && !dependenciesModified && version === mainVersion) {
                    return;
                }

                tasks.push(() => {

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
                });
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



/**
 * 获取模块编译版本号
 * @param  {string}  cwd 模块目录
 * @return {string}      版本号
 */
function getBuildVersion(cwd) {
    return childProcess.execSync('git log --pretty=format:"%h" -1', {
        cwd: cwd
    }).toString();
}


/**
 * Webpack 运行器 - 使用子进程启动 Webpack CLI
 * @param   {string}  configPath    配置文件路径
 * @param   {string}  cliOptions    命令行启动参数
 * @return  {Promise}
 */
function webpackRenner(configPath, cliOptions) {

    cliOptions += ' --config ' + configPath;
    cliOptions += ' --json';

    let cmd = webpackRenner.cmd;
    let cwd = path.dirname(configPath);

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

    //cmd = 'export DEPLOY=1 && ' + cmd; // TODO Windows 兼容

    return new Promise((resolve, reject) => {
        childProcess.exec(cmd + ' ' + cliOptions, {
            cwd: cwd
        }, (errors, stdout, stderr) => {
            if (errors) {
                reject(errors);
            } else {
                let data = stdout;
                let log;
                let match = data.match(/([\w\W]*?\n)?(\{\n[\w\W]*?\n\})\n?$/);

                if (match) {
                    log = match[1];
                    data = match[2];
                }

                if (log) {
                    console.log(log);
                }

                if (stderr) {
                    console.error(stderr);
                }

                try {
                    data = JSON.parse(data);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}
