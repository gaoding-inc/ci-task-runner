const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseify = require('./promiseify');
const access = promiseify(fs.access);
const WORKER_ENV = 'WORKER_ENV';


/**
 * 使用子进程运行命令
 * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
 * @param   {string}    command     命令
 * @param   {Object}    options     进程选项
 * @return  {Promise}
 */
module.exports = (command, options = {}) => {

    return new Promise((resolve, reject) => {

        // 子进程继承父进程的环境变量
        options = defaultsDeep({}, options, { env: process.env });
        options.env[WORKER_ENV] = '1';


        // 将 node_modules/.bin 加入环境变量，优先使用本地模块执行命令
        let addPath = cwd => {
            let env = options.env;
            if (cwd && env) {
                let localBin = path.resolve(cwd, 'node_modules', '.bin');
                if (env.PATH && !env.PATH.includes(localBin)) {
                    return access(localBin).then(() => {
                        env.PATH = localBin + ':' + env.PATH;
                    }).catch(() => {});
                }
            }
        };


        Promise.all([
            addPath(process.cwd()),
            addPath(options.cwd)
        ]).then(() => {
            let child;
            let closed;
            let timer = null;

            try {
                child = childProcess.exec(command, options);
            } catch (errors) {
                callback(errors);
            }

            child.stdout.on('data', content => {
                process.stdout.write(content);
            });

            child.stderr.on('data', content => {
                process.stderr.write(content);
            });


            child.on('exit', code => {
                if (code === 0) {
                    callback(null);
                } else {
                    callback(new Error(`"${command}": child process exited with code ${code}.`));
                }
            });


            // 解决 node timeout 不会走异常流程的问题
            if (options.timeout) {
                timer = setTimeout(() => {
                    callback(new Error(`"${command}": child process timeout.`));
                    child.kill();
                }, options.timeout);
            }


            function callback(errors, data) {
                if (closed) {
                    return;
                } else {
                    closed = true;
                }

                clearTimeout(timer);

                if (errors) {
                    console.error(`> ${command}`);
                    reject(errors);
                } else {
                    resolve(data);
                }
            }
        }).catch(reject);
    });
};