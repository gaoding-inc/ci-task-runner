'use strict';

const path = require('path');
const childProcess = require('child_process');
const fsp = require('./fs-promise');
const promiseify = require('./promiseify');
const exec = promiseify(childProcess.exec, childProcess);

const GIT_COMMIT_ID = Symbol('GIT_COMMIT_ID');
const READ_FILE = Symbol('READ_FILE');
const GET_STORAGE = Symbol('GET_STORAGE');

class GitCommit {

    constructor(dbPath, tableName = 'commit') {
        this.dbPath = dbPath;
        this.tableName = tableName;
        this.dirname = path.dirname(dbPath);
        this.cache = {};
        this.storage = this[GET_STORAGE]();
    }


    getOldCommitId(target) {
        return this.storage.then(storage => storage[this.tableName][target]);
    }


    getNewCommitId(target) {
        let commitId = this.cache[target];
        if (commitId) {
            return Promise.resolve(commitId);
        } else {
            return this[GIT_COMMIT_ID](target).then(commitId => {
                this.cache[target] = commitId;
                return commitId;
            });
        }
    }


    /**
     * 对比版本更改
     * @param   {string} target   目标
     * @return {Promise}
     */
    watch(target) {
        return Promise.all([this.getNewCommitId(target), this.getOldCommitId(target)]);
    }


    /**
     * 保存新的 git commit 到文件
     */
    save() {
        // 读取最新本地存储再写入，避免产生意外覆盖数据
        return this[READ_FILE]().then(data => {

            // 合并本地数据写入
            Object.assign(data[this.tableName], this.cache);

            // 将绝对路径转换为相对路径存储
            Object.keys(data[this.tableName]).forEach(target => {
                if (path.isAbsolute(target)) {
                    let commitId = data[this.tableName][target];
                    let relativePath = path.relative(this.dirname, target);
                    data[this.tableName][relativePath] = commitId;
                    delete data[this.tableName][target];
                }
            });
            return data;
        }).then(data => {
            let content = JSON.stringify(data, null, 2);
            return fsp.writeFile(this.dbPath, content, 'utf8');
        });
    }


    // 获取处理后的本地缓存
    [GET_STORAGE]() {
        return this[READ_FILE]().then(data => {

            // 将相对路径转换为绝对路径进行内部运算
            Object.keys(data[this.tableName]).forEach(target => {
                if (!path.isAbsolute(target)) {
                    let commitId = data[this.tableName][target];
                    let resolvePath = path.resolve(this.dirname, target);
                    data[this.tableName][resolvePath] = commitId;
                    delete data[this.tableName][target];
                }
            });

            return data;
        });
    }


    // 读取原始本地存储文件
    [READ_FILE]() {
        return fsp.readFile(this.dbPath, 'utf8')
            .then(json => JSON.parse(json))
            .catch(() => Promise.resolve({}))
            .then(data => {
                if (typeof data[this.tableName] !== 'object') {
                    data[this.tableName] = {};
                }
                return data;
            });
    }


    // 获取目标的 git commit id
    [GIT_COMMIT_ID](target) {
        let cwd = path.dirname(target);
        let basename = path.basename(target);

        let cmd = `git log --pretty=format:"%h" -1 ${basename}`;
        return exec(cmd, {
            cwd: cwd
        }).then(stdout => stdout.toString().trim());
    }

};


module.exports = GitCommit;