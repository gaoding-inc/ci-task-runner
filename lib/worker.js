const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const npmRunPath = require('npm-run-path');


/**
 * 使用子进程运行命令
 * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
 * @param   {string}    command     命令
 * @param   {Object}    options     进程选项
 * @return  {Promise}
 */
module.exports = (command, options = {}) => {

    return new Promise((resolve, reject) => {

        options = defaultsDeep({}, options, {
            // 子进程继承父进程的环境变量
            env: process.env
        }, {
            // 使用 npm 的 PATH
            env: npmRunPath.env({
                cwd: options.cwd || process.cwd()
            })
        });


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


        child.on('exit', (code, signal) => {
            if (code === 0) {
                callback(null);
            } else {
                callback(new Error(`exec "${command}": child process terminated due to receipt of signal ${signal}`));
            }
        });


        // 解决 node timeout 不会走异常流程的问题
        if (options.timeout) {
            timer = setTimeout(() => {
                callback(new Error(`exec "${command}": child process timeout`));
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
                errors.messsage = `exec "${command}": ${errors.messsage}`;
                reject(errors);
            } else {
                resolve(data);
            }
        }
    });
};