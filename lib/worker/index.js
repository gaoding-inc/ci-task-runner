'use strict';

const childProcess = require('child_process');
const TYPE = require('./type');
const workerFile = require.resolve('./worker.js');

/**
 * 在子进程运行脚本
 * @param   {string}    target      目标
 * @param   {any[]}     params      给目标函数传入的参数
 * @param   {Object}    options     子进程选项
 */
module.exports = (target, params = [], options = { timeout: Infinity }) => {
    return new Promise((resolve, reject) => {

        let timer = null;
        const worker = childProcess.fork(workerFile, options);

        // 监听子进程发送的消息
        worker.on('message', message => {
            if (!message) {
                return;
            }

            let cmd = message.cmd;
            let data = message.data;

            if (cmd === TYPE.WORKER_SUCCESS) {
                resolve(data);
            } else if (cmd === TYPE.WORKER_ERROR) {
                let errors = data;
                let isErrorObject = errors.type && errors.stack && errors.message;

                if (isErrorObject) {
                    switch (errors.type) {
                        case 'TypeError': errors = new TypeError(errors.message); break
                        case 'RangeError': errors = new RangeError(errors.message); break
                        case 'EvalError': errors = new EvalError(errors.message); break
                        case 'ReferenceError': errors = new ReferenceError(errors.message); break
                        case 'SyntaxError': errors = new SyntaxError(errors.message); break
                        case 'URIError': errors = new URIError(errors.message); break
                        default: errors = new Error(errors.message)
                    }
                    errors = Object.assign(errors, data);
                }

                reject(errors);
            } else if (TYPE.WORKER_CONSOLE_LOG && !options.silent) {
                console.log(...data);
            } else if (TYPE.WORKER_CONSOLE_ERROR && !options.silent) {
                console.error(...data);
            }
        });

        // 处理异常退出
        worker.on('exit', (code, signal) => {
            if (signal) {
                reject(`worker was killed by signal: ${signal}`);
            } else if (code !== 0) {
                reject(`worker exited with error code: ${code}`);
            } else {
                reject(`worker exited`);
            }
        });

        worker.on('error', reject);


        // 超时监控
        worker.on('listening', () => {
            worker.disconnect();
            timer = setTimeout(() => {
                worker.send({
                    cmd: TYPE.WORKER_EXIT,
                    data: {}
                }, () => {
                    reject(`worker timeout`);
                });
            }, options.timeout);
        });

        worker.on('disconnect', () => {
            clearTimeout(timer);
        });


        // 向子进程发起加载模块的指令
        try {
            worker.send({
                cmd: TYPE.WORKER_LAUNCH,
                data: {
                    target: target,
                    params: params
                }
            });
        } catch (errors) {
            reject(errors);
        }

    });

};