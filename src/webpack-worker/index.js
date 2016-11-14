'use strict';

const path = require('path');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const TYPE = require('./type');
const workerFile = path.join(__dirname, 'worker.js');


/**
 * Webpack 运行器 - 使用子进程启动 Webpack
 */
module.exports = (webpackPath, build) => {
    return new Promise((resolve, reject) => {

        let pending = true;
        let timer = null;

        const worker = childProcess.fork(workerFile, {
            cwd: build.cwd,
            execArgv: build.argv,
            env: defaultsDeep({
                [TYPE.WEBPACK_PATH]: webpackPath,
                [TYPE.WEBPACK_CONFIG_PATH]: build.launch
            }, build.env)
        });

        worker.on('message', message => {
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
            }, build.timeout);
        });

        worker.on('disconnect', () => {
            clearTimeout(timer);
        });

    });

};