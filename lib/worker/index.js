const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const promiseify = require('../promiseify');
const Server = require('./server');
const Client = require('./client');
const access = promiseify(fs.access);
const WORKER_ENV = 'WORKER_ENV';
const WORKER_ID = 'WORKER_ID';


/**
 * 使用子进程运行命令
 * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
 * @param   {string}    command     命令
 * @param   {Object}    options     进程选项
 * @return  {Promise}
 */
const worker = (command, options = {}) => {

    return new Promise((resolve, reject) => {

        // workerId 不使用进程 pid 的原因：
        // 1. nodejs 某些版本获取 pid 不准确
        // 2. 多层子进程，获取的 pid 不一定是 worker 的 pid
        const workerId = worker.id++;

        // 子进程继承父进程的环境变量
        options = defaultsDeep({}, options, { env: process.env });
        options.env[WORKER_ID] = workerId;
        options.env[WORKER_ENV] = '1';


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
            let child, server, closed;
            let timer = null;

            try {
                child = childProcess.exec(command, options);
                server = new Server(workerId);
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


            // 接收子进程运行结果通知
            server.on('message', (message, client) => {
                client.send(message, errors => {
                    callback(errors, message.data);
                });
            });


            // 解决 node timeout 不会走异常流程的问题
            if (options.timeout) {
                timer = setTimeout(() => {
                    callback(new Error(`"${command}": child process timeout.`));
                }, options.timeout);
            }


            function callback(errors, data) {
                if (closed) {
                    return;
                } else {
                    closed = true;
                }

                if (server) {
                    server.close();
                }

                clearTimeout(timer);

                if (errors) {
                    console.error(`> ${command}`);
                    reject(errors);
                } else {
                    resolve(data);
                }

                // if (child) {
                //     child.kill();
                // }
            }


            server.listen();

        }).catch(reject);
    });
};



/**
 * 向父进程发送消息（此方法仅在子进程中使用）
 * @param   {any}       data        JSON 数据
 * @param   {function}  callback    消息发送成功后的回调函数
 */
worker.send = (data, callback = () => { }) => {
    let client = new Client(process.env[WORKER_ID]);
    let requestId = worker.requestId++;

    client.on('message', message => {
        if (message.requestId === requestId) {
            callback();
        }
    });

    client.send({
        requestId: requestId,
        data: data
    });
};


worker.requestId = 0;
worker.id = 0;


module.exports = worker;