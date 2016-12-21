const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseify = require('./promiseify');
const access = promiseify(fs.access);

const DATA_TAG = 'WORKER:DATA';
const DATA_TAG_OPEN = `<${DATA_TAG}>`;
const DATA_TAG_CLOSE = `</${DATA_TAG}>`;
const DATA_TAG_REG = new RegExp(`${DATA_TAG_OPEN}(.*?)${DATA_TAG_CLOSE}`);

const WORKER_ENV = 'WORKER_ENV';
process.env[WORKER_ENV] = WORKER_ENV;


const decode = content => {
    let match = String(content).match(DATA_TAG_REG);
    if (match) {
        return JSON.parse(match[1]);
    }
};


const encode = data => {
    let json = JSON.stringify(data);
    json = `${DATA_TAG_OPEN}${json}${DATA_TAG_CLOSE}`;
    return json;
};


/**
 * 使用子进程运行命令
 * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
 * @param   {string}    command     命令
 * @param   {Object}    options     进程选项
 * @return  {Promise}
 */
const worker = (command, options = {}) => {

    return new Promise((resolve, reject) => {

        // 子进程继承父进程的环境变量
        options = defaultsDeep({}, options, { env: process.env });

        // 将 node_modules/.bin 加入环境变量，优先使用本地模块执行命令
        let addPath = cwd => {
            let env = options.env;
            if (cwd && env) {
                let localBin = path.resolve(cwd, 'node_modules', '.bin');
                if (env.PATH && !env.PATH.includes(localBin)) {
                    return access(localBin).then(() => {
                        env.PATH = localBin + ':' + env.PATH;
                    }).catch(() => { });
                }
            }
        };


        Promise.all([
            addPath(process.cwd()),
            addPath(options.cwd)
        ]).then(() => {
            let child;
            let timer = null;

            let cache = '';
            let jsonMode = false;

            let callback = (errors, data) => {
                callback = () => { };
                clearTimeout(timer);

                if (errors) {
                    console.error(`> ${command}`);
                    reject(errors);
                } else {
                    resolve(data);
                }

                if (child) {
                    child.kill();
                }
            };


            try {
                child = childProcess.exec(command, options)
            } catch (errors) {
                callback(errors);
            }

            child.stdout.setEncoding('utf8');
            child.stdout.on('data', content => {

                if (!jsonMode) {
                    jsonMode = content.includes(DATA_TAG_OPEN);
                }

                if (jsonMode) {
                    cache += content;
                } else {
                    process.stdout.write(content);
                }
            });


            child.stdout.on('end', () => {
                if (!jsonMode) {
                    return;
                }

                let log = cache.replace(DATA_TAG_REG, '');
                let data = decode(cache);

                if (log) {
                    process.stdout.write(log);
                }

                if (data) {
                    callback(null, data);
                }

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
                }, options.timeout);
            }

        }).catch(reject);
    });
};



/**
 * 向父进程发送消息 - 子进程只有一次机会发送消息，发送完毕后会被父进程关闭
 * worker.js 是使用 childProcess.exec() 来运行的子进程，
 * nodejs 没有为 exec() 提供进程之间发送消息的方法，所以这里创建私有协议来通讯
 * @param   {Object}    data    JSON 数据
 */
worker.send = (data) => {
    if (process.env[WORKER_ENV] === WORKER_ENV) {
        process.stdout.write(encode(data));
    }
};


module.exports = worker;