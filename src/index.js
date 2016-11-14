'use strict';

const path = require('path');
const util = require('util');
const gulp = require('gulp');
const rename = require('gulp-rename');
const fsp = require('fs-promise');
const numCPUs = require('os').cpus().length;
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('./lib/promise-task');
const getNodeModulePath = require('./lib/get-node-module-path');
const gitCommitId = require('./lib/get-commit-id');
const getChanged = require('./lib/get-changed');
const VError = require('verror');

const ASSETS_DEFAULT_NAME = './config/assets.default.json';
const ASSETS_DEFAULT_PATH = path.join(__dirname, ASSETS_DEFAULT_NAME);
const GIT_WEBPACK_DEFAULT = require('./config/git-webpack.default.json');
const ASSETS_DEFAULT = require(ASSETS_DEFAULT_NAME);
const MODULE_NAME_REG = /(\${moduleName})/g;



/**
 * 多进程构建任务管理器
 * @param   {Object}            options
 * @param   {Object[]|string[]} options.modules         模块目录列表
 * @param   {Object}            options.modules.name    模块目录名（相对）
 * @param   {string[]}          options.modules.watch   模块依赖目录（相对），继承 options.watch
 * @param   {Object}            options.modules.build   模块编译器设置，继承 options.build
 * @param   {string[]}          options.watch           模块组公共依赖（相对）
 * @param   {string}            options.assets          构建后文件索引表输出路径（相对）
 * @param   {number}            options.parallel        最大进程数
 * @param   {Object}            options.build           编译器设置
 * @param   {number}            options.build.timeout
 * @param   {boolean}           options.build.force
 * @param   {string}            options.build.launch                   
 * @param   {string}            options.build.cwd                   
 * @param   {Object}            options.build.env                   
 * @param   {string}            options.build.execPath                   
 * @param   {string}            options.build.execArgv                   
 * @param   {string}            options.build.silent             
 * @param   {string[]|number[]} options.build.stdio           
 * @param   {Object}            options.build.uid         
 * @param   {string}            options.build.gid         
 * @param   {string}            context                 工作目录（绝对路径）
 */
module.exports = (options = {}, context = process.cwd()) => {

    options = defaultsDeep({}, options, GIT_WEBPACK_DEFAULT);
    Object.freeze(options);

    let {assets, parallel} = options;
    let changedLength = 0;

    if (assets) {
        assets = path.join(context, assets);
    }

    if (parallel > numCPUs) {
        console.warn(`当前计算机 CPU 核心数为 ${numCPUs} 个，parallel 设置为 ${parallel}`);
    }

    return promiseTask.serial([


        // 转换 modules
        () => {
            return Object.keys(options.modules).map(key => {
                let module = options.modules[key];

                // 转换字符串形式的格式
                if (typeof module === 'string') {
                    module = { name: module, watch: [], build: {} };
                }

                // 模块继承父设置
                defaultsDeep(module.watch, options.watch);
                defaultsDeep(module.build, options.build);

                let build = module.build;

                // 转成绝对路径
                build.launch = path.join(context, build.launch.replace(MODULE_NAME_REG, module.name));
                build.cwd = path.join(context, build.cwd.replace(MODULE_NAME_REG, module.name));

                return module;
            });
        },


        // 对比版本的修改
        modules => {

            if (options.build.force) {
                changedLength = modules.length;
                return modules;
            }

            let isChanged = target => {
                let errorMessage = `无法获取变更记录，因为目标不在 git 仓库中 "${target}"`;
                try {
                    return getChanged(target);
                } catch (e) {
                    throw new VError(e, errorMessage);
                }
            };

            let watchChanged = options.watch
                .filter(target => isChanged(path.join(context, target))).length;

            return modules.filter((module) => {
                let modulePath = path.join(context, module.name);

                if (module.build.force || watchChanged || isChanged(modulePath)) {
                    Object.freeze(module);
                    changedLength ++;
                    return true;
                } else {
                    return false;
                }
            });
        },


        // 运行构建器
        modules => {

            let tasks = defaultsDeep(modules).map((module) => {
                let build = module.build;
                build.$builderPath = getNodeModulePath(build.builder, build.cwd);

                return () => {
                    let builder = require(`./builder/${module.build.builder}`);
                    return builder(module);
                };
            });

            return promiseTask.parallel(tasks, parallel);
        },


        // 创建资源索引
        moduleAssets => {
            let modulesMap = {};
            let assetsContent = defaultsDeep({}, ASSETS_DEFAULT);

            moduleAssets.forEach(module => {
                module.commit = gitCommitId(path.join(context, module.name));
                modulesMap[module.name] = module;
                delete modulesMap[module.name].name;
            });

            assetsContent.modified = (new Date()).toISOString();
            assetsContent.modules = modulesMap;
            return assetsContent;
        },


        // 保存资源索引文件（TIPS: 为了保证有效性，要第一时间读取最新描述文件再写入）
        assetsContent => {
            return assets ? fsp.readFile(assets, 'utf8')
                .catch(() => {
                    return new Promise((resolve, reject) => {
                        let basename = path.basename(assets);

                        // 使用 gulp 创建文件可避免目录不存在的问题
                        gulp.src(ASSETS_DEFAULT_PATH)
                            .pipe(rename(basename))
                            .pipe(gulp.dest(path.dirname(assets)))
                            .on('end', errors => {
                                if (errors) {
                                    reject(errors);
                                } else {
                                    resolve(JSON.stringify(ASSETS_DEFAULT));
                                }
                            });
                    });
                })
                .then(jsonText => {

                    let modulesMap = assetsContent.modules;

                    let relative = file => path.relative(path.dirname(assets), file);
                    let oldAssetsContent = JSON.parse(jsonText);

                    Object.keys(modulesMap).forEach(name => {

                        let oldModuleMap = oldAssetsContent.modules[name];
                        let module = modulesMap[name];
                        let chunks = module.chunks;
                        let assets = module.assets;


                        // 自动递增模块的编译版本号
                        if (oldModuleMap) {
                            module.version = oldModuleMap.version + 1;
                        }


                        // 将绝对路径转换为相对与资源描述文件的路径
                        Object.keys(chunks).forEach(name => {
                            let file = chunks[name];
                            chunks[name] = relative(file);
                        });

                        assets.forEach((file, index) => {
                            assets[index] = relative(file);
                        });
                    });


                    if (changedLength) {
                        let version = (Number(oldAssetsContent.version) || 0) + 1;
                        let newAssetsContent = defaultsDeep({ version }, assetsContent, oldAssetsContent);
                        let newAssetsContentText = JSON.stringify(newAssetsContent, null, 2);

                        return fsp.writeFile(assets, newAssetsContentText, 'utf8').then(() => newAssetsContent);
                    } else {
                        return oldAssetsContent;
                    }

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
