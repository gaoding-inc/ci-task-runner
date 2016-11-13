'use strict';

const path = require('path');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const TYPE = require('./type');
const workerFile = path.join(__dirname, 'worker.js');


/**
 * Webpack 运行器 - 使用子进程启动 Webpack
 * @param   {string}   webpackPath       Webpack 路径
 * @param   {string}   webpackConfigPath Webpack 配置文件路径
 * @param   {string[]} argv              命令行参数
 * @param   {Object}   env               环境变量
 * @param   {number}   timeout           超时
 * @return  {Promise}
 */
module.exports = ({webpackPath, webpackConfigPath, env = {}, argv = [], timeout = 1000 * 60}) => {
    return new Promise((resolve, reject) => {

        let pending = true;
        let timer = null;

        const worker = childProcess.fork(workerFile, {
            execArgv: argv,
            env: defaultsDeep({
                [TYPE.WEBPACK_PATH]: webpackPath,
                [TYPE.WEBPACK_CONFIG_PATH]: webpackConfigPath,
                [TYPE.WEBPACK_CONTEXT]: path.dirname(webpackConfigPath)
            }, env)
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

        worker.on('listening', () => {
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

};