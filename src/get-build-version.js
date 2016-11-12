'use strict';

const path = require('path');
const childProcess = require('child_process');

/**
 * 获取模块编译版本号
 * @param  {string}  file 文件或目录
 * @param  {string}  cwd  模块目录
 * @return {string}       编译版本号
 */
module.exports = function getBuildVersion(file, cwd = process.cwd()) {
    file = path.relative(cwd, file);
    return childProcess.execSync(`git log --pretty=format:"%h" -1 ${file}`, {
        cwd: cwd
    }).toString();
}