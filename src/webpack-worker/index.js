'use strict';

const path = require('path');
const childProcess = require('child_process');
const TYPE = require('./type');
const workerFile = path.join(__dirname, 'worker.js');


/**
 * Webpack 运行器 - 使用子进程启动 Webpack CLI
 * @param   {string}  configPath    配置文件路径
 * @param   {number}  timeout       超时
 * @return  {Promise}
 */
module.exports = (configPath, timeout = 1000 * 60) => {
    return new Promise((resolve, reject) => {

        let pending = true;
        let timer = null;

        const worker = childProcess.fork(workerFile, {
            env: {
                GIT_WEBPACK: 1,
                WEBPACK_CONFIG: configPath,
                WEBPACK_CONTEXT: path.dirname(configPath)
            }
        });

        worker.on('message', message => {
            //console.log(message);
            switch (message.cmd) {
                case TYPE.WEBPACK_RESULT:
                    pending = false;
                    if (message.errors) {
                        reject(message.errors);
                    } else {
                        resolve(message.data);
                    }
                    break;
            }
        });

        worker.on('exit', (code, signal) => {
            if (pending) {
                if (signal) {
                    reject(`worker was killed by signal: ${signal}`);
                } else if (code !== 0) {
                    reject(`worker exited with error code: ${code}`);
                }
            }
        });

        worker.on('error', (errors) => {
            throw errors;
        });

        worker.on('listening', (address) => {
            worker.send('shutdown');
            worker.disconnect();
            timer = setTimeout(() => {
                // TODO 显示日志
                worker.kill();
            }, timeout);
        });

        worker.on('disconnect', () => {
            clearTimeout(timer);
        });

    });



}