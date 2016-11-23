const color = require('cli-color');
const promiseTask = require('./lib/promise-task');
const Loger = require('./lib/loger');

/**
 * 启动模块设置的构建器
 * @param  {Object[]}  modules          模块列表
 * @param  {number}    parallel         最大并发数
 * @return {Promise}
 */
module.exports = (modules, parallel) => {

    let tasks = [[]];
    let prevLevel = 0;
    let loger = new Loger();

    let task = mod => () => {
        let runner = require(`./builder/${mod.builder.name}`);
        let date = (new Date()).toLocaleString();
        loger.log(`[task:start] [green]${mod.name}[/green] ${date}`);

        return runner(mod.builder).then((moduleAsset = {
            chunks: {},
            assets: []
        }) => {
            let date = (new Date()).toLocaleString();
            moduleAsset.name = mod.name;
            loger.log(`[task:end] [green]${mod.name}[/green] ${date}`);
            
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