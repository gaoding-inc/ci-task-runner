'use strict';

const path = require('path');
const childProcess = require('child_process');

/**
 * 获取目标自从上次提交以来是否有修改
 * @param  {string}  target   文件或目录绝对路径
 * @return {boolean}            
 */
module.exports = target => {
    let cwd = path.dirname(target);
    let basename = path.basename(target);

    let cmd = `git log --name-only --pretty=format:"" -1 ${basename}`;
    let log = childProcess.execSync(cmd, {
        cwd: cwd
    }).toString().trim();
    let changed = !!log.length;

    return changed;
};