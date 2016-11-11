'use strict';

/**
 * 将回调包装成 Promise
 * @param   {function}           回调函数
 * @param   {object|function}    上下文
 * @return  {Promise}
 */
function promisify(fn, receiver) {
    return function(...args) {
        return new Promise(function(resolve, reject) {
            fn.apply(receiver, [].concat(args, [function(err, res) {
                return err ? reject(err) : resolve(res);
            }]));
        });
    };
}

module.exports = promisify;