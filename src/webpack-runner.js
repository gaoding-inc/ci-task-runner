'use strict';

const path = require('path');
const childProcess = require('child_process');

/**
 * Webpack 运行器 - 使用子进程启动 Webpack CLI
 * @param   {string}  configPath    配置文件路径
 * @param   {string}  cliOptions    命令行启动参数
 * @return  {Promise}
 */
module.exports = function webpackRenner(configPath, cliOptions) {

    cliOptions += ' --config ' + configPath;
    cliOptions += ' --json';

    let cmd = webpackRenner.cmd;
    let cwd = path.dirname(configPath);

    if (!cmd) {
        try {
            let bin = require('webpack/package.json').bin;
            let binFile = typeof bin === 'string' ? bin : bin.webpack;
            let dir = path.join('webpack', binFile);
            let resolveFile = require.resolve(dir);
            cmd = webpackRenner.cmd = 'node ' + resolveFile;
        } catch (e) {
            cmd = webpackRenner.cmd = 'webpack';
        }
    }

    //cmd = 'export DEPLOY=1 && ' + cmd; // TODO Windows 兼容

    return new Promise((resolve, reject) => {
        childProcess.exec(cmd + ' ' + cliOptions, {
            cwd: cwd
        }, (errors, stdout, stderr) => {
            if (errors) {
                reject(errors);
            } else {
                let data = stdout;
                let log;
                let match = data.match(/([\w\W]*?\n)?(\{\n[\w\W]*?\n\})\n?$/);

                if (match) {
                    log = match[1];
                    data = match[2];
                }

                if (log) {
                    console.log(log);
                }

                if (stderr) {
                    console.error(stderr);
                }

                try {
                    data = JSON.parse(data);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}
