'use strict';

const path = require('path');
const childProcess = require('child_process');
const fsp = require('./fs-promise');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseify = require('./promiseify');
const exec = promiseify(childProcess.exec, childProcess);

const GIT_COMMIT_ID = Symbol('GIT_COMMIT_ID');

class GitCommit {

    constructor(dbPath, tableName = 'commit') {
        this.dbPath = dbPath;
        this.tableName = tableName;
        this.dirname = path.dirname(dbPath);
        this.storage = null;
        this.cache = {};
    }


    getOldCommitId(target) {
        return this.getStorage().then(storage => storage[this.tableName][target]);
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


    getStorage() {
        if (this.storage) {
            return this.storage;
        }

        return this.storage = fsp.readFile(this.dbPath, 'utf8')
            .then(JSON.parse)
            .catch(() => Promise.resolve({}))
            .then(data => {
                if (typeof data[this.tableName] !== 'object') {
                    data[this.tableName] = {};
                }

                Object.keys(data[this.tableName]).forEach(target => {
                    // 将相对路径转换为绝对路径进行内部运算
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



    getStorageCache() {
        return Promise.all([this.cache, this.storage])
            .then(([cache, storage]) => {
                let data = defaultsDeep(storage);
                Object.assign(data[this.tableName], cache);
                Object.keys(data[this.tableName]).forEach(target => {
                    // 将绝对路径转换为相对路径存储
                    if (path.isAbsolute(target)) {
                        let commitId = data[this.tableName][target];
                        let relativePath = path.relative(this.dirname, target);
                        data[this.tableName][relativePath] = commitId;
                        delete data[this.tableName][target];
                    }
                });
                return data;
            });
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
        return this.getStorageCache().then(data => {
            let content = JSON.stringify(data, null, 2);
            return fsp.writeFile(this.dbPath, content, 'utf8');
        });
    }



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