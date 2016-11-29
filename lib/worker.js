const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');

const DATA_TAG = 'WORKER_JSON_MESSAGE';
const DATA_TAG_OPEN = `<${DATA_TAG}>`;
const DATA_TAG_CLOSE = `</${DATA_TAG}>`;
const DATA_TAG_REG = new RegExp(`${DATA_TAG_OPEN}(.*?)${DATA_TAG_CLOSE}`);


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
 * @param   {string}    command     命令
 * @param   {Object}    options     进程选项
 * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
 */
const worker = (command, options = {}) => {

    options = defaultsDeep(options, {
        env: process.env
    });

    let run = (resolve, reject) => {
        let child = childProcess.exec(command, options);
        let timer = null;

        let jsonMode = false;
        let buffers = [];
        let nread = 0;

        let callback = (errors, data) => {
            clearTimeout(timer);
            if (errors) {
                console.error(`> ${command}`);
                reject(errors);
            } else {
                resolve(data);
            }
            child.kill();
        };


        child.stdout.on('data', content => {

            if (!jsonMode) {
                content = content.toString();
                jsonMode = content.includes(DATA_TAG_OPEN);
            }

            if (jsonMode) {
                buffers.push(content);
                nread += content.length;
            } else {
                process.stdout.write(content);
            }
        });


        child.stdout.on('end', () => {
            if (!jsonMode) {
                return;
            }

            let buffer = null;

            switch (buffers.length) {
                case 0:
                    buffer = new Buffer(0);
                    break;
                case 1:
                    buffer = buffers[0];
                    break;
                default:
                    buffer = new Buffer(nread);
                    for (let i = 0, pos = 0, l = buffers.length; i < l; i++) {
                        let chunk = buffers[i];
                        chunk.copy(buffer, pos);
                        pos += chunk.length;
                    }
                    break;
            }

            let content = buffer.toString();
            let data = decode(content);

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
                console.error(`cwd: ${options.cwd}`);
                callback(new Error(`"${command}": child process exited with code ${code}.`));
            }
        });


        // 解决 node timeout 不会走异常流程的问题
        if (options.timeout) {
            timer = setTimeout(() => {
                callback(new Error(`"${command}": child process timeout.`));
            }, options.timeout);
        }
    };

    return new Promise((...promiseParams) => {

        if (options.env && options.env.PATH) {
            // 将 node_modules/.bin 加入环境变量，优先使用本地模块执行命令
            let localBin = path.join(process.cwd(), 'node_modules', '.bin');
            if (options.env.PATH.includes(localBin)) {
                run(...promiseParams);
            } else {
                fs.access(localBin, errors => {
                    if (!errors) {
                        options.env.PATH = localBin + ':' + options.env.PATH;
                    }
                    run(...promiseParams);
                });
            }
        } else {
            run(...promiseParams);
        }
    });
};



/**
 * 向父进程发送消息
 * worker.js 是使用 childProcess.exec() 来运行的子进程，
 * nodejs 没有为 exec() 提供进程之间发送消息的方法，所以这里提供了私有协议来通讯
 * @param   {Object}    data    JSON 数据
 */
worker.send = (data) => {
    process.stdout.write(encode(data));
};


module.exports = worker;