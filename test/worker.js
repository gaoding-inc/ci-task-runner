let worker = require('../lib/worker');

worker('include-file /Users/tangbin/Documents/github/include-file/test', {
    env: process.env
}).then(d => {
    console.log('s', d);
}, e => {
    console.error('e', e);
});