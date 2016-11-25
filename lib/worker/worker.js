const TYPE = require('./type');

process.on('error', errors => {
    console.error(errors);
    process.exit(1);
});


process.on('message', message => {
    if (!message) {
        return;
    }

    let cmd = message.cmd;
    let data = message.data;

    if (cmd === TYPE.WORKER_LAUNCH) {

        // 接收子进程消息
        let onmessage = (errors, message) => {
            process.send({
                cmd: errors ? TYPE.WORKER_ERROR : TYPE.WORKER_SUCCESS,
                data: errors ? errors : message
            }, () => {
                process.exit(0);
            });
        };

        try {
            // 加载 Node 模块
            let worker = require(data.target);
            worker(...data.params, onmessage);
        } catch (errors) {
            // 向父进程报告错误堆栈
            process.send({
                cmd: TYPE.WORKER_ERROR,
                data: {
                    type: errors.constructor.name,
                    message: errors.message,
                    stack: errors.stack
                }
            }, () => {
                process.exit(1);
            });
        }
    } else if (cmd === TYPE.WORKER_EXIT) {
        process.exit(0);
    }
});

