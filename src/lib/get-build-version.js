'use strict';

const path = require('path');
const childProcess = require('child_process');

/**
 * 获取模块编译版本号
 * @param  {string}  target 文件或目录
 * @return {string}         编译版本号
 */
module.exports = target => {
    let cwd = path.dirname(target);
    let basename = path.basename(target);

    // TODO 检查文件是否存在
    let cmd = `git log --pretty=format:"%h" -1 ${basename}`;
    let version;

    version = childProcess.execSync(cmd, {
        cwd: cwd
    }).toString();

    return version;
};