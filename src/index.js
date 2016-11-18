'use strict';

const path = require('path');
const gulp = require('gulp');
const rename = require('gulp-rename');
const fsp = require('fs-promise');
const color = require('cli-color');
const numCPUs = require('os').cpus().length;
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('./lib/promise-task');
const template = require('./lib/template');
const getNodeModulePath = require('./lib/get-node-module-path');
const getCommitId = require('./lib/get-commit-id');
const VError = require('verror');

const ASSETS_DEFAULT_NAME = './config/assets.default.json';
const ASSETS_DEFAULT_PATH = path.join(__dirname, ASSETS_DEFAULT_NAME);
const GIT_WEBPACK_DEFAULT = require('./config/git-webpack.default.json');
const ASSETS_DEFAULT = require(ASSETS_DEFAULT_NAME);



/**
 * 多进程构建任务管理器
 * @param   {Object}            options
 * @param   {Object[]|string[]} options.modules         模块目录列表
 * @param   {Object}            options.modules.name    模块目录名（相对）
 * @param   {string[]}          options.modules.librarys   模块依赖目录（相对），继承 options.librarys
 * @param   {Object}            options.modules.builder    模块编译器设置，继承 options.builder
 * @param   {string[]}          options.librarys           模块组公共依赖（相对）
 * @param   {string}            options.assets          构建后文件索引表输出路径（相对）
 * @param   {number}            options.parallel        最大进程数
 * @param   {Object}            options.builder           编译器设置
 * @param   {string}            options.builder.name
 * @param   {boolean}           options.builder.force
 * @param   {number}            options.builder.timeout
 * @param   {string}            options.builder.launch                   
 * @param   {string}            options.builder.cwd                   
 * @param   {Object}            options.builder.env                   
 * @param   {string}            options.builder.execPath                   
 * @param   {string}            options.builder.execArgv                   
 * @param   {string}            options.builder.silent             
 * @param   {string[]|number[]} options.builder.stdio           
 * @param   {Object}            options.builder.uid         
 * @param   {string}            options.builder.gid         
 * @param   {string}            context                 工作目录（绝对路径）
 */
module.exports = (options = {}, context = process.cwd()) => {
    options = defaultsDeep({}, options, GIT_WEBPACK_DEFAULT);
    Object.freeze(options);

    let {assets, parallel} = options;
    let modulesChanged = false;
    let assetsPath = path.join(context, assets);
    let preCommit = {};
    let latestCommit = {};

    if (parallel > numCPUs) {
        console.warn(color.yellow(`[warn] 当前计算机 CPU 核心数为 ${numCPUs} 个，parallel 设置为 ${parallel}`));
    }

    return promiseTask.serial([


        // 读取上一次的编译记录
        () => {
            return fsp.readFile(assetsPath, 'utf8').catch(() => {
                return new Promise((resolve, reject) => {
                    let basename = path.basename(assetsPath);

                    // 使用 gulp 创建文件可避免目录不存在的问题
                    gulp.src(ASSETS_DEFAULT_PATH)
                        .pipe(rename(basename))
                        .pipe(gulp.dest(path.dirname(assetsPath)))
                        .on('end', errors => {
                            if (errors) {
                                reject(errors);
                            } else {
                                resolve(JSON.stringify(ASSETS_DEFAULT));
                            }
                        });
                });
            }).then(assetsContent => {
                assetsContent = JSON.parse(assetsContent);
                let {modules, librarys} = assetsContent;
                Object.keys(modules).forEach(name => preCommit[name] = modules[name].commit);
                Object.keys(librarys).forEach(name => preCommit[name] = librarys[name].commit);
            });
        },


        // 转换 modules
        () => {
            return Object.keys(options.modules).map(key => {
                let module = options.modules[key];

                // 转换字符串形式的格式
                if (typeof module === 'string') {
                    module = { name: module, librarys: [], builder: {} };
                }

                // 模块继承父设置
                defaultsDeep(module.librarys, options.librarys);
                defaultsDeep(module.builder, options.builder);

                let builder = module.builder;
                let data = {
                    // TODO moduleCommit
                    moduleName: module.name
                };

                // builder 设置变量，路径相关都转成绝对路径
                builder.cwd = path.join(context, template(builder.cwd, data));
                builder.launch = path.join(context, template(builder.launch, data));
                builder.execArgv = builder.execArgv.map(argv => template(argv, data));
                Object.keys(builder.env).forEach(key => builder.env[key] = template(builder.env[key], data));

                return module;
            });
        },


        // 对比版本的修改
        modules => {


            let diff = name => {
                let target = path.join(context, name);
                try {
                    let commit = latestCommit[name] ? latestCommit[name].commit : getCommitId(target);
                    latestCommit[name] = { commit };
                    // 如果之前未构建，preCommit[name] 为 undefined
                    return commit !== preCommit[name] || !preCommit[name];
                } catch (e) {
                    throw new VError(e, `无法获取变更记录，因为目标不在 git 仓库中 "${target}"`);
                }
            };


            return modules.filter((module) => {

                let moduleChaned = diff(module.name);
                let librarysChanged = module.librarys.filter(name => diff(name)).length;

                if (module.builder.force || librarysChanged || moduleChaned) {
                    Object.freeze(module);
                    modulesChanged = true;
                    return true;
                } else {
                    console.log(color.yellow(`\n[task:ignore] name: ${module.name}\n`));
                    return false;
                }
            });
        },


        // 运行构建器
        modules => {

            let tasks = defaultsDeep(modules).map((module) => {
                let builder = module.builder;
                builder.$builderPath = getNodeModulePath(builder.name, builder.cwd);

                return () => {
                    let builder = require(`./builder/${module.builder.name}`);
                    return builder(module).then(moduleAsset => {
                        console.log(`\n[task:end] ${color.green(module.name)}\n`);
                        return moduleAsset;
                    });
                };
            });

            return promiseTask.parallel(tasks, parallel);
        },


        // 创建资源索引
        moduleAssets => {
            let modulesMap = {};
            let assetsContent = defaultsDeep({}, {
                librarys: latestCommit
            }, ASSETS_DEFAULT);

            moduleAssets.forEach(module => {
                module.commit = getCommitId(path.join(context, module.name));
                modulesMap[module.name] = module;
                delete modulesMap[module.name].name;
            });

            assetsContent.date = (new Date()).toLocaleString();
            assetsContent.modules = modulesMap;
            return assetsContent;
        },


        // 保存资源索引文件（TIPS: 为了保证有效性，要第一时间读取最新描述文件再写入）
        assetsContent => {
            return fsp.readFile(assetsPath, 'utf8').then(JSON.parse).then(preAssetsContent => {

                let modulesMap = assetsContent.modules;
                let relative = file => path.relative(path.dirname(assetsPath), file);
                let latest = []

                Object.keys(modulesMap).forEach(name => {

                    latest.push(name);

                    let oldModule = preAssetsContent.modules[name];
                    let module = modulesMap[name];
                    let chunks = module.chunks;
                    let assets = module.assets;

                    // 自动递增模块的编译版本号
                    if (oldModule) {
                        module.version = oldModule.version + 1;
                    }

                    // 将绝对路径转换为相对与资源描述文件的路径
                    Object.keys(chunks).forEach(name => chunks[name] = relative(chunks[name]));
                    assets.forEach((file, index) => assets[index] = relative(file));

                });

                Object.assign(preAssetsContent.modules, modulesMap);
                Object.assign(preAssetsContent.librarys, module.librarys);
                preAssetsContent.version = (Number(preAssetsContent.version) || 0) + 1;
                preAssetsContent.latest = latest;
                preAssetsContent.date = (new Date()).toLocaleString();

                let newAssetsContentText = JSON.stringify(preAssetsContent, null, 2);

                return fsp.writeFile(assetsPath, newAssetsContentText, 'utf8').then(() => preAssetsContent);

            })
        },


        // 显示日志
        assetsContent => {
            // silent
            // if (process.stdout.isTTY) {
            //     console.log(util.inspect(assetsContent, {
            //         colors: true,
            //         depth: null
            //     }));
            // } else {
            //     console.log(JSON.stringify(assetsContent, null, 2));
            // }
        }

    ]).catch(errors => process.nextTick(() => {
        throw errors;
    }));
};
