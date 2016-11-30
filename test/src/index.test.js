const assert = require('assert');
const path = require('path');
const moduleWatcher = require('../../src/index');


describe('#index', () => {

    it('moduleWatcher.send()', () => {
        let options = {
            modules: ['script'],
            assets: path.join(__dirname, '..', 'dist', 'assets.json'),
            program: {
                command: 'node ${modulePath}/send.js'
            }
        };
        let context = path.join(__dirname, '..', 'file', 'script');

        return moduleWatcher(options, context).then(assets => {
            assert.deepEqual({
                script: 'index.js'
            }, assets.modules.chunks);
            assert.deepEqual(['index.js', 'index.js.map', 'index.css'], assets.modules.assets);
        });
    });

});
