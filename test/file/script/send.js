const path = require('path');
const moduleWatcher = require('../../../src/index');

setTimeout(() => {
    moduleWatcher.send({
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