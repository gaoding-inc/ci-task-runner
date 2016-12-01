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
    let preOrder = 0;


    let task = mod => () => {

        let program = mod.program;
        let date = (new Date()).toLocaleString();

        let loger = new Loger([
            { color: 'green' },
            null,
            { color: 'green', minWidth: 16 },
            { textDecoration: 'underline' },
            { color: 'gray' }
        ]);

        loger.log('•', 'watcher:', mod.name, '[task running]', date);

        return worker(program.command, program.options).then((buildResult = {
            chunks: {},
            assets: []
        }) => {

            Object.assign(buildResult, {
                name: mod.name
            });

            let date = (new Date()).toLocaleString();
            loger.log('•', 'watcher:', mod.name, '[task success]', date);

            return buildResult;
        }).catch(errors => {
            let loger = new Loger([{ color: 'red' }, null, { color: 'red', minWidth: 16 }]);
            loger.error('•', 'watcher:', mod.name, '[task failure]');
            return errors;
        });
    };

    modules.sort((a, b) => a.order - b.order).forEach(mod => {
        if (mod.order === preOrder) {
            tasks[tasks.length - 1].push(task(mod));
        } else {
            tasks.push([task(mod)]);
        }
        preOrder = mod.order;
    });


    return promiseTask.serial(tasks.map(tasks => () => {
        return promiseTask.parallel(tasks, parallel);
    })).then(buildResults => {
        return [].concat(...buildResults);
    });
};