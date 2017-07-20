const promiseTask = require('./promise-task');
const Loger = require('./loger');
const worker = require('./run-cmd');
const PACKAGE = require('../package.json');


/**
 * 启动任务设置的构建器
 * @param  {Object[]}  tasks            任务列表
 * @param  {number}    parallel         最大并发数
 * @return {Promise}
 */
module.exports = (tasks, parallel = require('os').cpus().length) => {

    const taskFucs = [[]];
    let preOrder = 0;


    const taskFuc = task => () => {

        const program = task.program;
        const time = Date.now();
        const logStyles = [
            null,
            { minWidth: 16, color: 'green', textDecoration: 'underline' },
            null,
            { color: 'gray' }
        ];

        const loger = new Loger([null, ...logStyles]);
        loger.log('░░', `${PACKAGE.name}:`, task.name, '[running]');

        return worker(program.command, program.options).then(() => {

            const loger = new Loger([{ color: 'green' }, ...logStyles]);
            const timeEnd = Math.round((Date.now() - time) / 1000)
            loger.log('░░', `${PACKAGE.name}:`, task.name, '[success]', `${timeEnd}s`);

        }).catch(errors => {
            const loger = new Loger([{ color: 'red' }, ...logStyles]);
            loger.error('░░', `${PACKAGE.name}:`, task.name, '[failure]');
            throw errors;
        });
    };

    tasks.sort((a, b) => a.order - b.order).forEach(task => {
        if (task.order === preOrder) {
            taskFucs[taskFucs.length - 1].push(taskFuc(task));
        } else {
            taskFucs.push([taskFuc(task)]);
        }
        preOrder = task.order;
    });


    return promiseTask.serial(taskFucs.map(taskFucs => () => {
        return promiseTask.parallel(taskFucs, parallel);
    })).then(buildResults => {
        return [].concat(...buildResults);
    });
};