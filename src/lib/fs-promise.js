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

const writeFile = (...params) => {
    let dirname = path.dirname(params[0]);
    mkdirs(dirname, ()=> {
        fs.writeFile(...params);
    });
};

module.exports = {
    writeFile: promiseify(writeFile),
    readFile: promiseify(fs.readFile)
};