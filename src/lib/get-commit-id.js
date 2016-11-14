'use strict';

const path = require('path');
const childProcess = require('child_process');

/**
 * 获取模块 git commit id
 * @param  {string}  target  文件或目录绝对路径
 * @return {string}          git commit id
 */
module.exports = target => {
    let cwd = path.dirname(target);
    let basename = path.basename(target);

    let cmd = `git log --pretty=format:"%h" -1 ${basename}`;
    let commit = childProcess.execSync(cmd, {
        cwd: cwd
    }).toString().trim();;

    return commit;
};