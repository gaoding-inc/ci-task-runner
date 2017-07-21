/**
 * 将回调包装成 Promise
 * @param   {function}           回调函数
 * @param   {any}                上下文
 * @return  {Promise}
 */
module.exports = (fn, receiver) => {
    return (...args) => {
        return new Promise((resolve, reject) => {
            fn.apply(receiver, [...args, (err, res) => {
                return err ? reject(err) : resolve(res);
            }]);
        });
    };
};