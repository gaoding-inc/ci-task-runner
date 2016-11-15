'use strict';

const path = require('path');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const TYPE = require('./type');
const workerFile = path.join(__dirname, 'worker.js');


/**
 * Webpack 运行器 - 使用子进程启动 Webpack
 * @param   {Object}    module  模块描述信息
 */
module.exports = ({builder}) => {
    return new Promise((resolve, reject) => {

        let pending = true;
        let timer = null;
        let options = defaultsDeep({}, {
            env: {
                [TYPE.WEBPACK_PATH]: builder.$builderPath,
                [TYPE.WEBPACK_CONFIG_PATH]: builder.launch
            }
        }, builder);

        const worker = childProcess.fork(workerFile, options);

        worker.on('message', message => {
            if (message && message.cmd === TYPE.WEBPACK_RESULT) {
                pending = false;

                if (message.errors) {
                    reject(message.errors);
                } else {
                    resolve(message.data);
                }
                
                worker.kill();
            }
        });

        worker.on('exit', (code, signal) => {
            if (!pending) {
                return;
            }
            if (signal) {
                reject(`worker was killed by signal: ${signal}`);
            } else if (code !== 0) {
                reject(`worker exited with error code: ${code}`);
            } else {
                reject(`worker exited`);
            }
        });

        worker.on('error', (errors) => {
            if (pending) {
                reject(errors);
            }
        });

        worker.on('listening', () => {
            worker.send('shutdown');
            worker.disconnect();
            timer = setTimeout(() => {
                // TODO 显示日志
                worker.kill();
            }, builder.timeout);
        });

        worker.on('disconnect', () => {
            clearTimeout(timer);
        });

    });

};