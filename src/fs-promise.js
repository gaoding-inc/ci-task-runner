const fs = require('fs');
const path = require('path');
const promiseify = require('./promiseify');

const mkdirs = (dirname, callback) => {
    fs.access(dirname, errors => {
        if (errors) {
            mkdirs(path.dirname(dirname), () => {
                fs.mkdir(dirname, callback);
            });
        } else {
            callback();
        }
    });
};


/**
 * 写文件（自动创建目录）
 * @see     fs.writeFile
 * @return  {Promise}
 */
const writeFile = promiseify((...params) => {
    const file = params[0];
    const dirname = path.dirname(file);
    mkdirs(dirname, ()=> {
        fs.writeFile(...params);
    });
});


/**
 * 读文件
 * @see     fs.readFile
 * @return  {Promise}
 */
const readFile = promiseify(fs.readFile);

module.exports = {
    writeFile,
    readFile
};