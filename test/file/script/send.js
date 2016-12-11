const path = require('path');
const taskRunner = require('../../../src/index');

setTimeout(() => {
    taskRunner.send({
        chunks: {
            index: path.join(__dirname, '..', '..', 'dist', 'index.js')
        },
        assets: [
            path.join(__dirname, '..', '..', 'dist', 'index.js'),
            path.join(__dirname, '..', '..', 'dist', 'index.js.map'),
            path.join(__dirname, '..', '..', 'dist', 'index.css')
        ]
    });
}, 500);