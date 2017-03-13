const path = require('path');
const childProcess = require('child_process');
const fsp = require('./fs-promise');
const promiseify = require('./promiseify');
const exec = promiseify(childProcess.exec);

const GET_REVISION = Symbol('GET_REVISION');
const GET_STORAGE = Symbol('GET_STORAGE');
const READ_FILE = Symbol('READ_FILE');

class Repository {

    /**
     * 仓库的变更观察者
     * @param   {string}    storagePath 版本记录文件地址
     * @param   {string}    type        仓库类型，支持 git 与 svn
     * @param   {string}    tableName   记录版本数据的字段前缀
     */
    constructor(storagePath, type = 'git', tableName = 'revision') {
        this.storagePath = storagePath;
        this.type = type.toLowerCase();
        this.tableName = tableName;
        this.dirname = path.dirname(storagePath);
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
            return this[GET_REVISION](target).then(commitId => {
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
            return fsp.writeFile(this.storagePath, content, 'utf8');
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
        return fsp.readFile(this.storagePath, 'utf8')
            .then(json => JSON.parse(json))
            .catch(() => Promise.resolve({}))
            .then(data => {
                if (typeof data[this.tableName] !== 'object') {
                    data[this.tableName] = {};
                }
                return data;
            });
    }


    // 获取目标的修订 ID
    [GET_REVISION](target) {
        let type = this.type;
        let cwd = path.dirname(target);
        let basename = path.basename(target);
        let cmd;
        let runner;

        if (type === 'git') {
            cmd = `git log --pretty=format:"%h" -1 -- ${JSON.stringify(basename)}`;
            runner = exec(cmd, {
                cwd
            }).then(stdout => stdout.toString().trim());
        } else if (type === 'svn') {
            cmd = `svn log --limit 1 --xml ${JSON.stringify(basename)}`;
            runner = exec(cmd, {
                cwd
            }).then(stdout => {
                stdout = stdout.toString().trim();
                stdout = stdout.match(/revision="([^"]*?)"/)[1];
                return stdout;
            });
        } else {
            runner = Promise.reject(`does not support "${type}".`);
        }

        runner.catch(errors => {
            console.error(`"${target}": the file is not in the repository.`);
            return Promise.reject(errors);
        });

        return runner;
    }

}


module.exports = Repository;