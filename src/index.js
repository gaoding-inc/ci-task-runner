const path = require('path');
const fsp = require('../lib/fs-promise');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('../lib/promise-task');
const Repository = require('../lib/repository');
const worker = require('../lib/worker');
const Loger = require('../lib/loger');
const DEFAULT = require('./config/config.default.json');
const ASSETS_DEFAULT = require('./config/assets.default.json');

const parse = require('./parse');
const build = require('./build');
const merge = require('./merge');


/**
 * 支持增量与多进程的构建任务调度器
 * @param   {Object}            options                         @see config/config.default.json
 * @param   {Object[]|string[]} options.modules                 模块目录列表
 * @param   {Object}            options.modules.name            模块目录名（相对）
 * @param   {string[]}          options.modules.dependencies    模块依赖目录（相对），继承 options.dependencies
 * @param   {Object}            options.modules.program         模块构建器设置，继承 options.program
 * @param   {string[]}          options.dependencies            模块组公共依赖（相对）
 * @param   {string}            options.assets                  构建后文件索引表输出路径（相对）
 * @param   {string}            options.repository              仓库类型，可选 git|svn
 * @param   {number}            options.parallel                最大并发进程数
 * @param   {boolean}           options.force                   是否强制全部构建
 * @param   {Object}            options.program                 构建器设置
 * @param   {string}            options.program.command         构建器运行命令
 * @param   {string}            options.program.options         构建器子进程配置 @see childProcess.exec() options 
 * @param   {string}            context                         工作目录（绝对路径）
 * @return  {Promise}
 */
const moduleWatcher = (options = {}, context = process.cwd()) => {
    
    options = defaultsDeep({}, options, DEFAULT);
    options.assets = path.resolve(context, options.assets);

    const repository = new Repository(options.assets, options.repository, 'revision');
    const tasks = [


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
            const loger = new Loger([{color: 'gray'}, null, {color: 'green', minWidth: 16}]);
            return modules.filter(mod => {
                if (mod.dirty) {
                    return true
                } else {
                    loger.log('•', 'watcher:', mod.name, '[no changes]');
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
            let assetsDiranme = path.dirname(options.assets);
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
            return fsp.readFile(options.assets, 'utf8')
                .then(json => defaultsDeep({}, JSON.parse(json)))
                .catch(() => defaultsDeep({}, ASSETS_DEFAULT))
                .then(oldAssets => merge(assets, oldAssets, options.assets))
                .then(assets => {
                    let json = JSON.stringify(assets, null, 2);
                    return fsp.writeFile(options.assets, json, 'utf8').then(() => assets);
                });
        },


        // 保存当前已编译的版本信息
        // 必须构建完才保存版本信息，否则构建失败后下一次可能不会重新构建
        assets => {
            return repository.save().then(() => assets);
        }

    ];

    return promiseTask.serial(tasks).then(results => {
        return results[results.length - 1];
    });
};


/**
 * 向 moduleWatcher 发送消息
 * 构建器可以调用此方法，以便集中管理构建输出的资源（可选）
 * @param   {Object}    data            JSON 数据
 * @param   {Object}    data.chunks     入口文件映射表
 * @param   {string[]}  data.assets     所有构建输出的资源绝对路径列表
 */
moduleWatcher.send = worker.send;

module.exports = moduleWatcher;