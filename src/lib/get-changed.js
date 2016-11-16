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
    let cmd = `git log --name-only --pretty=format:"" -1 ${cwd}`;
    let log = childProcess.execSync(cmd, {
        cwd: cwd
    }).toString().trim();
    let fileList = log.split(/\n/);
    let changed = fileList.filter(file => target.lastIndexOf(file) !== -1).length;

    return changed;
};