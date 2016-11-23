'use strict';

const path = require('path');
const defaultsDeep = require('lodash.defaultsdeep');
const numCPUs = require('os').cpus().length;
const promiseTask = require('./lib/promise-task');
const GitCommit = require('./lib/git-commit');
const Loger = require('./lib/loger');
const DEFAULT = require('./config/config.default.json');

const createModules = require('./create-modules');
const buildModules = require('./build-modules');
const saveAssets = require('./save-assets');


/**
 * 多进程构建任务管理器
 * @param   {Object}            options                 @see config/config.default.json
 * @param   {Object[]|string[]} options.modules         模块目录列表
 * @param   {Object}            options.modules.name    模块目录名（相对）
 * @param   {string[]}          options.modules.librarys   模块依赖目录（相对），继承 options.librarys
 * @param   {Object}            options.modules.builder    模块构建器设置，继承 options.builder
 * @param   {string[]}          options.librarys           模块组公共依赖（相对）
 * @param   {string}            options.assets          构建后文件索引表输出路径（相对）
 * @param   {number}            options.parallel        最大进程数
 * @param   {boolean}           options.force           是否强制全部构建
 * @param   {Object}            options.builder         构建器设置
 * @param   {string}            options.builder.name
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
 * @return  {Promise}
 */
module.exports = (options = {}, context = process.cwd()) => {
    options = defaultsDeep({}, options, DEFAULT);
    
    let assetsPath = path.resolve(context, options.assets);
    
    let loger = new Loger();

    if (options.parallel > numCPUs) {
        loger.log(`[yellow][task:warn] 当前计算机 CPU 核心数为 ${numCPUs} 个，但 parallel 设置为 ${options.parallel}[/yellow]`);
    }

    return promiseTask.serial([

        createModules(options, context),

        // 检查模块是否有变更
        modules => {
            let gitCommit = new GitCommit(assetsPath);
            return Promise.all(modules.map(mod => {
                return Promise.all([

                    gitCommit.watch(mod.path),
                    ...mod.librarys.map(lib => gitCommit.watch(lib.path))

                ]).then(([modCommit, ...libCommits]) => {

                    let modChanged = modCommit[0] !== modCommit[1];
                    let libChanged = libCommits.filter(libCommit => libCommit[0] !== libCommit[1]).length !== 0;
                    mod.dirty = options.force || modChanged || libChanged;
                    return mod;
                });
            })).then(modules => {
                return gitCommit.save().then(() => modules);
            });
        },


        // 过滤未修改的版本
        modules => {
            return modules.filter(mod => {
                if (mod.dirty) {
                    return true
                } else {
                    loger.log(`[yellow][task:ignore] ${mod.name}[/yellow]`);
                    return false;
                }
            });
        },


        // 运行构建器
        modules => {
            return buildModules(modules, options.parallel);
        },


        // 保存资源索引文件
        modulesAssets => {
            return saveAssets(assetsPath, modulesAssets);
        }

    ]);
};
