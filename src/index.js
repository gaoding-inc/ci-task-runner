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
 * @param   {Object}            options.builder         编译器设置
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
    let assetsPath = path.join(context, assets);

    let preCommit = {};
    let latestCommit = {};
    let librarysCommit = {};


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
                // 缓存上一次编译的 commit id
                assetsContent = JSON.parse(assetsContent);
                let {modules, librarys} = assetsContent;
                Object.keys(modules).forEach(name => preCommit[name] = modules[name].commit);
                Object.keys(librarys).forEach(name => preCommit[name] = librarys[name]);
            });
        },


        // 标准化配置
        () => {

            let normalize = mod => {
                // 转换字符串形式的格式
                if (typeof mod === 'string') {
                    mod = { name: mod, librarys: [], builder: {} };
                } else if (Array.isArray(mod)) {
                    return mod.map(normalize);
                }

                // 模块继承父设置
                defaultsDeep(mod.librarys, options.librarys);
                defaultsDeep(mod.builder, options.builder);

                return mod;
            };

            return options.modules.map(normalize);
        },


        // 过滤未修改的版本
        modules => {

            let diff = name => {
                let target = path.join(context, name);
                try {
                    let commit = latestCommit[name] ? latestCommit[name].commit : getCommitId(target);
                    latestCommit[name] = commit;
                    // 如果之前未构建，preCommit[name] 为 undefined
                    let dirty = commit !== preCommit[name] || !preCommit[name];
                    return { commit, dirty };
                } catch (e) {
                    throw new VError(e, `无法获取变更记录，因为目标不在 git 仓库中 "${target}"`);
                }
            };

            let filter = mod => {
                if (Array.isArray(mod)) {
                    return mod.filter(filter);
                }

                let moduleChaned = diff(mod.name).dirty;
                let librarysChanged = mod.librarys.filter(name => {
                    let ret = diff(name);
                    librarysCommit[name] = ret.commit;
                    return ret.dirty;
                }).length;

                if (mod.builder.force || librarysChanged || moduleChaned) {
                    return true;
                } else {
                    console.log(color.yellow(`\n[task:ignore] name: ${mod.name}\n`));
                    return false;
                }
            };

            return modules.filter(filter);
        },


        // 运行构建器
        modules => {

            let task = mod => {

                if (Array.isArray(mod)) {
                    return promiseTask.parallel(mod.map(task), parallel);
                }

                let builder = defaultsDeep(mod.builder);
                let data = {
                    moduleName: mod.name,
                    moduleCommit: latestCommit[mod.name]
                };

                // builder 设置变量，路径相关都转成绝对路径
                builder.cwd = path.join(context, template(builder.cwd, data));
                builder.launch = path.join(context, template(builder.launch, data));
                builder.execArgv = builder.execArgv.map(argv => template(argv, data));
                Object.keys(builder.env).forEach(key => builder.env[key] = template(builder.env[key], data));
                builder.$builderPath = getNodeModulePath(builder.name, builder.cwd);

                return () => {
                    let runner = require(`./builder/${builder.name}`);
                    return runner(builder).then(moduleAsset => {
                        console.log(`\n[task:end] ${color.green(mod.name)}\n`);
                        moduleAsset.name = mod.name;
                        return moduleAsset;
                    });
                };
            };

            let tasks = modules.map(task);

            return promiseTask.serial(tasks).then(moduleAssets => [].concat(...moduleAssets));
        },


        // 创建资源索引
        moduleAssets => {
            let modulesMap = {};
            let assetsContent = defaultsDeep({}, {
                librarys: librarysCommit
            }, ASSETS_DEFAULT);

            moduleAssets.forEach(mod => {
                mod.commit = latestCommit[mod.name];
                modulesMap[mod.name] = mod;
                delete modulesMap[mod.name].name;
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
                    let mod = modulesMap[name];
                    let chunks = mod.chunks;
                    let assets = mod.assets;

                    // 自动递增模块的编译版本号
                    if (oldModule) {
                        mod.version = oldModule.version + 1;
                    }

                    // 将绝对路径转换为相对与资源描述文件的路径
                    Object.keys(chunks).forEach(name => chunks[name] = relative(chunks[name]));
                    assets.forEach((file, index) => assets[index] = relative(file));

                });

                Object.assign(preAssetsContent.modules, modulesMap);
                Object.assign(preAssetsContent.librarys, assetsContent.librarys);
                preAssetsContent.version = (Number(preAssetsContent.version) || 0) + 1;
                preAssetsContent.latest = latest;
                preAssetsContent.date = (new Date()).toLocaleString();

                let newAssetsContentText = JSON.stringify(preAssetsContent, null, 2);

                return fsp.writeFile(assetsPath, newAssetsContentText, 'utf8').then(() => preAssetsContent);

            })
        }

    ]).catch(errors => process.nextTick(() => {
        throw errors;
    }));
};
