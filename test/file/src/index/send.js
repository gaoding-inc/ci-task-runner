const taskRunner = require('../../../../src/index');

setTimeout(() => {
    taskRunner.send({
        hello: 'world'
    });
}, 500);