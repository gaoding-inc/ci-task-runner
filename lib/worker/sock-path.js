'use strict';
const path = require('path');
const os = require('os');
const tmpDir = os.tmpDir();

module.exports = (name) => {
    let sockPath = path.join(tmpDir, `worker.${name}.sock`);

    if (process.platform === 'win32') {
        sockPath = sockPath.replace(/^\//, '');
        sockPath = sockPath.replace(/\//g, '-');
        sockPath = '\\\\.\\pipe\\' + sockPath;
    }

    return sockPath;
};