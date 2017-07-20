const spawn = require('child_process').spawn
const EventEmitter = require('events').EventEmitter

module.exports = (cmd, args, options) => {
    const raw = spawn(cmd, args, options);
    const cooked = new EventEmitter();

    raw.on('error', (er) => {
        er.file = cmd;
        cooked.emit('error', er);
    }).on('close', (code, signal) => {
        // Create ENOENT error because Node.js v0.8 will not emit
        // an `error` event if the command could not be found.
        if (code === 127) {
            const er = new Error('spawn ENOENT');
            er.code = 'ENOENT';
            er.errno = 'ENOENT';
            er.syscall = 'spawn';
            er.file = cmd;
            cooked.emit('error', er);
        } else {
            cooked.emit('close', code, signal);
        }
    })

    cooked.stdin = raw.stdin;
    cooked.stdout = raw.stdout;
    cooked.stderr = raw.stderr;
    cooked.kill = sig => raw.kill(sig);

    return cooked
};