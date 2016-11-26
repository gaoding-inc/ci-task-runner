const childProcess = require('child_process');

const exec = (command, options = {}) => {
    return new Promise((resolve, reject) => {
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
            let data = exec.decode(content);
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
    });
};

exec.decode = content => {
    let match = String(content).match(/<EXEC_DATA_MESSAGE>(.*?)<\/EXEC_DATA_MESSAGE>/);
    if (match) {
        return JSON.parse(match[1]);
    }
};

exec.encode = data => {
    let json = JSON.stringify(data);
    json = `<EXEC_DATA_MESSAGE>${json}</EXEC_DATA_MESSAGE>`;
    return json;
};

exec.send = data => {
    process.stdout.write(exec.encode(data));
};

module.exports = exec;