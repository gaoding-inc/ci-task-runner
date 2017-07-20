/**
 * 串行执行任务
 * @param   {function[]|any[]}     tasks 任务列表，任务函数返回 Promise
 * @return  {Promise}
 */
const serial = tasks => {
    let p = Promise.resolve();
    const results = [];

    const each = task => {
        if (typeof task === 'function') {
            p = p.then(task).then(result => {
                results.push(result);
                return result;
            });
        } else {
            each(() => task);
        }
    }

    tasks.forEach(each);

    return p.then(() => results);
}

/**
 * 并行执行任务
 * @param   {function[]|any[]}     tasks 任务列表，任务函数返回 Promise
 * @param   {number}               limit 最大并发数
 * @return  {Promise}
 */
const parallel = (tasks, limit = tasks.length) => {
    if (limit === tasks.length) {
        return Promise.all(tasks.map(task => {
            try {
                return typeof task === 'function' ? task() : task;
            } catch (e) {
                return Promise.reject(e);
            }
        }));
    } else {
        const chunks = [];
        tasks = [...tasks];

        for (let i = 0, len = tasks.length; i < len; i += limit) {
            chunks.push(tasks.slice(i, i + limit));
        }

        return serial(chunks.map(chunk => () => parallel(chunk)))
            .then((results) => [].concat(...results));
    }
}

// async function parallel(tasks, limit) {
//     const currentTasks = tasks.splice(0, limit);
//     await Promise.all(tasks.map(task => {
//         try {
//             return task();
//         } catch (e) {
//             return Promise.reject(e);
//         }
//     }));
//     tasks.length && chunk(tasks, limit);
// }

module.exports = {
    serial,
    parallel
};