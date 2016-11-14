'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const gulp = require('gulp');
const rename = require('gulp-rename');
const fsp = require('fs-promise');
const VError = require('verror');
const numCPUs = require('os').cpus().length;
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('./lib/promise-task');
const getNodeModulePath = require('./lib/get-node-module-path');
const promiseify = require('./lib/promiseify');
const dirtyChecking = require('./dirty-checking');

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
module.exports = function (options = {}, context = process.cwd()) {

    options = defaultsDeep({}, options, GIT_WEBPACK_DEFAULT);

    let {assets, parallel} = options;

    if (assets) {
        assets = path.join(context, assets);
    }

    if (parallel) {
        parallel = Math.min(parallel, numCPUs);
    }

    return promiseTask.serial([


        // 转换 modules
        () => {
            return Object.keys(options.modules).map(key => {
                let module = options.modules[key];

                // 转换字符串形式的格式
                if (typeof module === 'string') {
                    module = { name: module, dependencies: [], build: [] };
                }

                // 模块继承父设置
                defaultsDeep(module.dependencies, options.dependencies);
                defaultsDeep(module.build, options.build);

                let build = module.build;

                // 转成绝对路径
                build.launch = path.join(context, build.launch.replace(MODULE_NAME_REG, module.name));
                build.cwd = path.join(context, build.cwd.replace(MODULE_NAME_REG, module.name));

                return module;
            });
        },


        // 过滤未变更的模块目录
        modules => {
            return modules.filter((module) => {
                let diff = dirtyChecking(module, context);
                module.build.$dirty = diff.dirty;
                module.build.$version = diff.version;
                return diff.dirty;
            });
        },


        // 运行构建器
        modules => {

            let tasks = defaultsDeep(modules).map((module) => {
                let build = module.build;
                build.$builderPath = getNodeModulePath(build.builder, build.cwd);

                return () => {
                    let builder = require(`./builder/${module.build.builder}`);
                    return builder(module, assets);
                };
            });

            return promiseTask.parallel(tasks, parallel);
        },


        // 包装数据
        moduleAssets => {
            let assetsContent = defaultsDeep({}, ASSETS_DEFAULT);
            assetsContent.modified = (new Date()).toISOString();
            assetsContent.modules = moduleAssets;
            return assetsContent;
        },


        // 保存当前编译结果（TIPS: 要注意多个实例并行的时候配置错乱问题）
        assetsContent => {
            return assets ? fsp.readFile(assets, 'utf8')
                .catch(() => {
                    return new Promise((resolve, reject) => {
                        let basename = path.basename(assets);

                        // 使用 gulp 创建文件可避免目录不存在的问题
                        gulp.src(ASSETS_DEFAULT_PATH)
                            .pipe(rename(basename))
                            .pipe(gulp.dest(path.dirname(assets)))
                            .on('end', errors => errors ? reject(errors) : resolve());
                    });
                })
                .then(jsonText => {

                    let modules = assetsContent.modules;
                    let relative = (file) => path.relative(path.dirname(assets), file);

                    // 将绝对路径转换为相对与资源描述文件的路径
                    Object.keys(modules).forEach(name => {
                        let module = modules[name];
                        let chunks = module.chunks;
                        let assets = module.assets;

                        Object.keys(chunks).forEach(name => {
                            let file = chunks[name];
                            chunks[name] = relative(file);
                        });

                        assets.forEach((file, index) => {
                            assets[index] = relative(file);
                        });
                    });

                    let oldJson = JSON.parse(jsonText);
                    let version = (Number(oldJson.version) || 0) + 1;
                    let newJson = defaultsDeep({ version }, assetsContent, oldJson);
                    let newJsonText = JSON.stringify(newJson, null, 2);

                    return fsp.writeFile(assets, newJsonText, 'utf8').then(() => newJson);
                }) : assetsContent
        },


        // 显示日志
        assetsContent => {
            if (process.stdout.isTTY) {
                console.log(util.inspect(assetsContent, {
                    colors: true,
                    depth: null
                }));
            } else {
                console.log(JSON.stringify(assetsContent, null, 2));
            }
        }

    ]).catch(errors => process.nextTick(() => {
        throw errors;
    }));
};
