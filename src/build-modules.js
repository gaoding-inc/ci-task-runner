const promiseTask = require('../lib/promise-task');
const Loger = require('../lib/loger');
const worker = require('../lib/worker');


/**
 * 启动模块设置的构建器
 * @param  {Object[]}  modules          模块列表
 * @param  {number}    parallel         最大并发数
 * @return {Promise}
 */
module.exports = (modules, parallel = require('os').cpus().length) => {

    let tasks = [[]];
    let prevLevel = 0;
    let loger = new Loger();

    let task = mod => () => {
        // TODO 改成外部 npm 模块，以插件的方式载入
        let plugin = require.resolve(`../builder/${mod.builder.name}`);
        let date = (new Date()).toLocaleString();
        let message = `[green]•[/green] module: [green]${mod.name}[/green]`;

        loger.log(`${message} start [gray]${date}[/gray]`);

        return worker(plugin, [mod.builder], mod.builder).then((modAsset = {
            chunks: {},
            assets: []
        }) => {
            let date = (new Date()).toLocaleString();
            modAsset.name = mod.name;

            if (modAsset.log && !mod.builder.silent) {
                console.log(modAsset.log);
            }

            loger.log(`${message} end [gray]${date}[/gray]\n`);
            
            return modAsset;
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
    })).then(modAssets => {
        return [].concat(...modAssets);
    });
};