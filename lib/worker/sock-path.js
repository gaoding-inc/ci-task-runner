'use strict';
const path = require('path');
const os = require('os');
const tmpDir = os.tmpDir();

/**
 * 返回临时文件路径
 * @param   {string}    name    名称
 * @return  {string} 
 */
module.exports = (name) => {
    let sockPath = path.join(tmpDir, `worker.${name}.sock`);

    if (process.platform === 'win32') {
        sockPath = sockPath.replace(/^\//, '');
        sockPath = sockPath.replace(/\//g, '-');
        sockPath = '\\\\.\\pipe\\' + sockPath;
    }

    return sockPath;
};