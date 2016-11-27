const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const DATA_TAG = 'WORKER_JSON_MESSAGE';
const DATA_TAG_REG = new RegExp(`<${DATA_TAG}>(.*?)</${DATA_TAG}>`);


const decode = content => {
    let match = String(content).match(DATA_TAG_REG);
    if (match) {
        return JSON.parse(match[1]);
    }
};


const encode = data => {
    let json = JSON.stringify(data);
    json = `<${DATA_TAG}>${json}</${DATA_TAG}>`;
    return json;
};


/**
 * 使用子进程运行命令
 * @param   {string}    command     命令
 * @param   {Object}    options     进程选项
 * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
 */
const worker = (command, options = {}) => {

    let run = (resolve, reject) => {
        let child = childProcess.exec(command, options);
        let timer = null;
        let callback = (errors, data) => {
            clearTimeout(timer);
            if (errors) {
                reject(errors);
            } else {
                resolve(data);
            }
        };


        child.stdout.on('data', content => {
            let data = decode(content);
            if (data) {
                callback(null, data);
            } else {
                process.stdout.write(content);
            }
        });


        child.stderr.on('data', content => {
            process.stderr.write(content);
        });


        child.on('exit', code => {
            clearTimeout(timer);
            if (code === 0) {
                callback(null);
            } else {
                callback(new Error(`"${command}": child process exited with code ${code}.`));
            }
        });


        // 解决 node timeout 不会走异常流程的问题
        if (options.timeout) {
            timer = setTimeout(() => {
                reject(new Error(`"${command}": child process timeout.`));
                child.kill();
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
 * @param   {Object}    data    JSON 数据
 */
worker.send = data => {
    process.stdout.write(encode(data));
};


module.exports = worker;