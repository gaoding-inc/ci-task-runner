'use strict';

const path = require('path');
const fsp = require('../lib/fs-promise');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('../lib/promise-task');
const Repository = require('../lib/repository');
const Loger = require('../lib/loger');
const DEFAULT = require('./config/config.default.json');
const ASSETS_DEFAULT = require('./config/assets.default.json');

const parse = require('./parse');
const build = require('./build');
const merge = require('./merge');


/**
 * 多进程构建任务管理器
 * @param   {Object}            options                 @see config/config.default.json
 * @param   {Object[]|string[]} options.modules         模块目录列表
 * @param   {Object}            options.modules.name    模块目录名（相对）
 * @param   {string[]}          options.modules.dependencies   模块依赖目录（相对），继承 options.dependencies
 * @param   {Object}            options.modules.program    模块构建器设置，继承 options.program
 * @param   {string[]}          options.dependencies           模块组公共依赖（相对）
 * @param   {string}            options.assets          构建后文件索引表输出路径（相对）
 * @param   {string}            options.repository      仓库类型，可选 git|svn
 * @param   {number}            options.parallel        最大进程数
 * @param   {boolean}           options.force           是否强制全部构建
 * @param   {Object}            options.program         构建器设置
 * @param   {string}            options.program.name
 * @param   {number}            options.program.timeout
 * @param   {string}            options.program.launch
 * @param   {string}            options.program.cwd
 * @param   {Object}            options.program.env
 * @param   {string}            options.program.execPath
 * @param   {string}            options.program.execArgv
 * @param   {string}            options.program.silent
 * @param   {string[]|number[]} options.program.stdio
 * @param   {Object}            options.program.uid
 * @param   {string}            options.program.gid
 * @param   {string}            context                 工作目录（绝对路径）
 * @return  {Promise}
 */
module.exports = (options = {}, context = process.cwd()) => {
    options = defaultsDeep({}, options, DEFAULT);

    const assetsPath = path.resolve(context, options.assets);
    const loger = new Loger();
    const repository = new Repository(assetsPath, options.repository, 'revision');

    return promiseTask.serial([


        // 将外部输入的配置转换成内部模块描述队列
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
                    loger.log(`[gray]•[/gray] module: [green]${mod.name}[/green] ignore`);
                    return false;
                }
            });
        },


        // 运行构建器
        modules => {
            return build(modules, options.parallel);
        },


        // 创建资源描述对象
        buildResults => {
            let now = (new Date()).toLocaleString();
            let assetsDiranme = path.dirname(assetsPath);
            let relative = file => path.relative(assetsDiranme, file);
            let assets = {
                version: 1,
                date: now,
                latest: [],
                modules: {}
            };

            buildResults.forEach(buildResult => {
                let aChunks = buildResult.chunks;
                let aAssets = buildResult.assets;

                // 转换为相对路径
                Object.keys(aChunks).forEach(name => aChunks[name] = relative(aChunks[name]));
                aAssets.forEach((file, index) => aAssets[index] = relative(file));

                buildResult.version = 1;
                buildResult.date = now;
                buildResult.chunks = aChunks;
                buildResult.assets = aAssets;
                assets.latest.push(buildResult.name);
                assets.modules[buildResult.name] = buildResult;
            });

            return assets;
        },


        // 合并资源索引文件
        assets => {
            return fsp.readFile(assetsPath, 'utf8')
                .then(json => defaultsDeep({}, JSON.parse(json)))
                .catch(() => defaultsDeep({}, ASSETS_DEFAULT))
                .then(oldAssets => merge(assets, oldAssets, assetsPath))
                .then(assets => {
                    let json = JSON.stringify(assets, null, 2);
                    return fsp.writeFile(assetsPath, json, 'utf8').then(() => assets);
                });
        },


        // 保存当前已编译的版本信息
        // 必须构建完才保存版本信息，否则构建失败后下一次可能不会重新构建
        assets => {
            return repository.save().then(() => assets);
        }

    ]);
};
