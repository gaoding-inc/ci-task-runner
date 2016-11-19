const path = require('path');
const color = require('cli-color');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseTask = require('./lib/promise-task');
const template = require('./lib/template');
const getNodeModulePath = require('./lib/get-node-module-path');;

/**
 * 启动模块设置的编译器
 * @param  {Object[]}  modules      模块列表
 * @param  {number}    parallel     最大并发数
 * @param  {Object}    templateData 字符串模板变量
 * @param  {string}    context      工作路径
 * @return {Promise}
 */
module.exports = (modules, parallel, templateData, context) => {

    let task = mod => {

        if (Array.isArray(mod)) {
            return mod.map(task);
        }

        let builder = defaultsDeep(mod.builder);
        let data = templateData[mod.name];

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

    let tasks = modules.map(mod => {
        let fn = task(mod);
        if (typeof fn === 'function') {
            // 串行任务
            return fn;
        } else {
            // 并行任务
            return () => promiseTask.parallel(fn, parallel);
        }
    });

    return promiseTask.serial(tasks).then(moduleAssets => {
        return [].concat(...moduleAssets);
    });
};