const promiseTask = require('../lib/promise-task');
const Loger = require('../lib/loger');
const worker = require('../lib/worker');
const PACKAGE = require('../package.json');


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
        let time = Date.now();
        let logStyles = [
            null,
            {  minWidth: 16, color: 'green', textDecoration: 'underline' },
            null,
            { color: 'gray' }
        ];

        let loger = new Loger([null, ...logStyles]);
        loger.log('░░', `${PACKAGE.name}:`, mod.name, '[running]');

        return worker(program.command, program.options).then((buildResult = {
            chunks: {},
            assets: []
        }) => {

            Object.assign(buildResult, {
                name: mod.name
            });

            let loger = new Loger([{ color: 'green' }, ...logStyles]);
            let timeEnd = Date.now() - time;
            loger.log('░░', `${PACKAGE.name}:`, mod.name, '[success]', `${timeEnd}ms`);

            return buildResult;
        }).catch(errors => {
            let loger = new Loger([{ color: 'red' }, ...logStyles]);
            loger.error('░░', `${PACKAGE.name}:`, mod.name, '[failure]');
            throw errors;
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