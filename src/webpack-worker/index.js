'use strict';

const path = require('path');
const childProcess = require('child_process');
const TYPE = require('./type');
const workerFile = path.join(__dirname, 'worker.js');


/**
 * Webpack 运行器 - 使用子进程启动 Webpack CLI
 * @param   {string}  configPath    配置文件路径
 * @param   {string}  cliOptions    命令行启动参数
 * @return  {Promise}
 */
module.exports = (configPath, cliOptions) => {
    const TIMEOUT = 1000 * 60;
    return new Promise((resolve, reject) => {

        let pending = true;
        let timer = null;

        const worker = childProcess.fork(workerFile, {
            env: {
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

                // case TYPE.CONSOLE_LOG:
                //     console.log(...message.data);
                //     break;

                // case TYPE.CONSOLE_ERROR:
                //     console.error(...message.data);
                //     break;
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
            }, TIMEOUT);
        });

        worker.on('disconnect', () => {
            clearTimeout(timer);
        });

    });



}