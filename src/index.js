'use strict';

const path = require('path');
const color = require('cli-color');
const VError = require('verror');
const numCPUs = require('os').cpus().length;
const promiseTask = require('./lib/promise-task');
const getCommitId = require('./lib/get-commit-id');

const normalizeOptions = require('./normalize-options');
const readAssets = require('./read-assets');
const filterModules = require('./filter-modules');
const buildModules = require('./build-modules');
const createAssets = require('./create-assets');


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
 * @param   {boolean}           options.force           是否强制全部编译
 * @param   {Object}            options.builder         编译器设置
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
 */
module.exports = (options = {}, context = process.cwd()) => {
    options = normalizeOptions(options);
    Object.freeze(options);

    let {assets, parallel} = options;
    let assetsPath = path.resolve(context, assets);

    let preCommit = {};
    let latestCommit = {};
    let templateData = {};


    if (parallel > numCPUs) {
        console.warn(color.yellow(`[warn] 当前计算机 CPU 核心数为 ${numCPUs} 个，parallel 设置为 ${parallel}`));
    }

    return promiseTask.serial([


        // 读取上一次的编译记录
        () => readAssets(assetsPath),


        // 缓存 git commit id
        assetsContent => {
            let {modules, librarys} = assetsContent;
            let getCommit = target => {
                try {
                    return getCommitId(target);
                } catch (e) {
                    throw new VError(e, `无法获取变更记录，因为目标不在 git 仓库中 "${target}"`);
                }
            };

            Object.keys(modules).forEach(name => {
                let target = path.resolve(context, name);
                preCommit[name] = modules[name].commit;
                latestCommit[name] = latestCommit[name] || getCommit(target);
                templateData[name] = {
                    moduleName: name,
                    moduleCommit: latestCommit[name]
                };
            });

            Object.keys(librarys).forEach(name => {
                let target = path.resolve(context, name);
                preCommit[name] = librarys[name];
                latestCommit[name] = latestCommit[name] || getCommit(target);
            });
        },


        // 过滤未修改的版本
        () => filterModules(options.modules, name => {
            let dirty = options.force || latestCommit[name] !== preCommit[name];
            return dirty;
        }),


        // 运行构建器
        modules => buildModules(modules, options.parallel, templateData, context),


        // 保存资源索引文件
        modulesAssets => createAssets(assetsPath, modulesAssets, latestCommit)

    ]).catch(errors => process.nextTick(() => {
        throw errors;
    }));
};
