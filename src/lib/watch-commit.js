'use strict';

const path = require('path');
const childProcess = require('child_process');
const promiseify = require('./promiseify');
const exec = promiseify(childProcess.exec, childProcess);
const fsp = require('fs-promise');


/**
 * 获取模块 git commit id
 * @param  {string}  target  文件或目录绝对路径
 * @return {Promise}
 */
const gitCommitId = target => {
    let cwd = path.dirname(target);
    let basename = path.basename(target);

    let cmd = `git log --pretty=format:"%h" -1 ${basename}`;
    return exec(cmd, {
        cwd: cwd
    }).then(stdout => stdout.toString().trim());
};


/**
 * 观察目标的 `git commit` 变更
 * @param   {string|staring[]}    target      要被观察的文件或路径
 * @param   {string}              dbPath      数据文件保存路径
 * @return  {Promise}
 */
module.exports = (target, dbPath) => {

    let isArray = Array.isArray(target);
    target = isArray ? target : [target];
    // TODO target 去重

    let oldCommitIdMap = fsp.readFile(dbPath, 'utf8').then(JSON.parse).catch(() => Promise.resolve({}));
    let newCommitIdMap = Promise.all(target.map(gitCommitId)).then((commitIds) => {
        let cache = {};
        commitIds.forEach((commitId, index) => {
            let name = target[index];
            cache[name] = commitId;
        });
        return cache;
    });

    return Promise.all([newCommitIdMap, oldCommitIdMap])
        .then(([newCommitIdMap, oldCommitIdMap]) => {

            let results = target.map(name => ([newCommitIdMap[name], oldCommitIdMap[name]]));
            let map = Object.assign(newCommitIdMap, oldCommitIdMap);
            let content = JSON.stringify(map, null, 2);

            return fsp.writeFile(dbPath, content, 'utf8')
                .then(() => isArray ? results : results[0]);
        });
};