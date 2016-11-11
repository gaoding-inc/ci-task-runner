/**
 * 串行执行任务
 * @param  {function[]}     tasks 任务列表，任务函数返回 Promise
 * @return {Promise}
 */
function serial(tasks) {
    let p = Promise.resolve();
    tasks.forEach(fn => {
        p = p.then(fn);
    });
    return p;
}

/**
 * 并行执行任务
 * @param  {function[]}     tasks 任务列表，任务函数返回 Promise
 * @param   {number}        limit 最大并发数
 * @return  {Promise}
 */
function parallel(tasks, limit = tasks.length) {
    if (limit === tasks.length) {
        return Promise.all(tasks.map(fn => {
            try {
                return fn();
            } catch (e) {
                return Promise.reject(e);
            }
        }));
    } else {
        let chunks = [];
        tasks = [...tasks];

        for (let i = 0, len = tasks.length; i < len; i += limit) {
            chunks.push(tasks.slice(i, i + limit));
        }

        return serial(chunks.map(chunk => () => parallel(chunk)));
    }
}

// async function parallel(tasks, limit) {
//     const currentTasks = tasks.splice(0, limit);
//     await Promise.all(tasks.map(fn => {
//         try {
//             return fn();
//         } catch (e) {
//             return Promise.reject(e);
//         }
//     }));
//     tasks.length && chunk(tasks, limit);
// }

module.exports = {
    serial: serial,
    parallel: parallel
};