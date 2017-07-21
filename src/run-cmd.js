const spawn = require('./spawn');
const npmRunPath = require('npm-run-path');
const defaultsDeep = require('lodash.defaultsdeep');

const run = (cmd, { env, cwd, uid, gid }, callback) => {
    const conf = { env, cwd, uid, gid, stdio: [0, 1, 2] };

    let sh = 'sh';
    let shFlag = '-c';

    if (process.platform === 'win32') {
        sh = process.env.comspec || 'cmd';
        shFlag = '/d /s /c';
        conf.windowsVerbatimArguments = true;
    }

    const proc = spawn(sh, [shFlag, cmd], conf);

    proc.on('error', procError);
    proc.on('close', function (code, signal) {
        if (signal) {
            process.kill(process.pid, signal);
        } else if (code) {
            const er = new Error(`child process exited with code ${code}`);
            er.errno = code;
            procError(er)
        } else {
            callback(null);
        }
    })
    process.once('SIGTERM', procKill);
    process.once('SIGINT', procInterupt);

    function procError(er) {
        if (er) {
            if (er.code !== 'EPERM') {
                er.code = 'ELIFECYCLE';
            }
        }
        process.removeListener('SIGTERM', procKill);
        process.removeListener('SIGTERM', procInterupt);
        process.removeListener('SIGINT', procKill);
        return callback(er);
    }

    function procKill() {
        proc.kill();
    }

    function procInterupt() {
        proc.kill('SIGINT');
        proc.on('exit', function () {
            process.exit();
        });
        process.once('SIGINT', procKill);
    }

    return {
        kill: procKill
    };
};


/**
 * 执行命令
 * @param   {string}    command         命令
 * @param   {Object}    options         进程选项
 * @param   {Object}    options.env     环境变量
 * @param   {string}    options.cwd     工作目录
 * @param   {number}    options.timeout 超时时间
 * @param   {number}    options.uid     UID
 * @param   {number}    options.gid     GID
 * @return  {Promise}
 */
module.exports = (command, options = {}) => {

    return new Promise((resolve, reject) => {

        options = defaultsDeep({}, options, {
            env: npmRunPath.env({
                cwd: options.cwd || process.cwd(),
                env: defaultsDeep({}, options.env, process.env)
            })
        });

        let timer = null;
        const callback = (errors, data) => {
            clearTimeout(timer);

            if (errors) {
                errors.message = `run "${command}" failed: ${errors.message}`;
                reject(errors);
            } else {
                resolve(data);
            }
        };


        const spawn = run(command, options, callback);

        if (options.timeout) {
            timer = setTimeout(() => {
                spawn.kill();
                callback(new Error(`child process timeout`));
            }, options.timeout);
        }
    });
};