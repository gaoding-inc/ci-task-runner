'use strict';

const path = require('path');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('../lib/promise-task');
const Repository = require('../lib/repository');
const Loger = require('../lib/loger');
const DEFAULT = require('./config/config.default.json');

const parse = require('./parse');
const build = require('./build');
const assets = require('./assets');


/**
 * 多进程构建任务管理器
 * @param   {Object}            options                 @see config/config.default.json
 * @param   {Object[]|string[]} options.modules         模块目录列表
 * @param   {Object}            options.modules.name    模块目录名（相对）
 * @param   {string[]}          options.modules.dependencies   模块依赖目录（相对），继承 options.dependencies
 * @param   {Object}            options.modules.builder    模块构建器设置，继承 options.builder
 * @param   {string[]}          options.dependencies           模块组公共依赖（相对）
 * @param   {string}            options.assets          构建后文件索引表输出路径（相对）
 * @param   {string}            options.repository      仓库类型，可选 git|svn
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
    
    const assetsPath = path.resolve(context, options.assets);
    const loger = new Loger();
    const repository = new Repository(assetsPath, options.repository, 'revision');

    return promiseTask.serial([

        parse(options, context),

        // 检查模块是否有变更
        modules => {
            return Promise.all(modules.map(mod => {
                return Promise.all([

                    repository.watch(mod.path),
                    ...mod.dependencies.map(lib => repository.watch(lib.path))

                ]).then(([modCommit, ...libCommits]) => {

                    let modChanged = modCommit[0] !== modCommit[1];
                    let libChanged = libCommits.filter(libCommit => libCommit[0] !== libCommit[1]).length !== 0;
                    mod.dirty = options.force || modChanged || libChanged;
                    return mod;
                });
            }));
        },


        // 过滤未修改的版本
        modules => {
            return modules.filter(mod => {
                if (mod.dirty) {
                    return true
                } else {
                    loger.log(`[yellow]•[/yellow] module: [green]${mod.name}[/green] ignore`);
                    return false;
                }
            });
        },


        // 运行构建器
        modules => {
            return build(modules, options.parallel);
        },


        // 保存资源索引文件
        modulesAssets => {
            return assets(assetsPath, modulesAssets);
        },


        // 保存最新的版本信息
        assetsContent => {
            // 必须构建完才保存版本信息，否则构建失败后下一次可能不会重新构建
            return repository.save().then(() => assetsContent);
        }

    ]);
};
