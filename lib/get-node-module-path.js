'use strict';
const childProcess = require('child_process');

/**
 * 查找本地 Node 模块路径
 * @param   {string}    name    模块名
 * @param   {string}    cwd     工作目录
 */
module.exports = (name, cwd) => {
    let cmd = `node --print "require.resolve('${name}')"`;
    let path = childProcess.execSync(cmd, { cwd: cwd }).toString().trim();
    return path;
};
