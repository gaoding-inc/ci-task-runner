const color = require('cli-color');
const promiseTask = require('./lib/promise-task');

/**
 * 启动模块设置的构建器
 * @param  {Object[]}  modules          模块列表
 * @param  {number}    parallel         最大并发数
 * @return {Promise}
 */
module.exports = (modules, parallel) => {

    let tasks = [[]];
    let prevLevel = 0;

    let task = mod => () => {
        let runner = require(`./builder/${mod.builder.name}`);
        console.log(`[task:start] ${color.green(mod.name)}`);
        return runner(mod.builder).then(moduleAsset => {
            console.log(`[task:end] ${color.green(mod.name)}`);
            moduleAsset.name = mod.name;
            return moduleAsset;
        });
    };

    modules.sort((a, b) => a.level - b.level).forEach(mod => {
        if (mod.level === prevLevel) {
            tasks[tasks.length - 1].push(task(mod));
        } else {
            tasks.push([task(mod)]);
        }
        prevLevel = mod.level;
    });


    return promiseTask.serial(tasks.map(tasks => () => {
        return promiseTask.parallel(tasks, parallel);
    })).then(moduleAssets => {
        return [].concat(...moduleAssets);
    });
};