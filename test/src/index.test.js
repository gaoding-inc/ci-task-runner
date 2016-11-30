const assert = require('assert');
const path = require('path');
const moduleWatcher = require('../../src/index');


describe('#index', () => {

    it('moduleWatcher.send()', () => {
        let name = 'script';
        let options = {
            modules: [name],
            assets: path.join(__dirname, '..', 'dist', 'assets.json'),
            program: {
                command: 'node ${modulePath}/send.js'
            }
        };
        let context = path.join(__dirname, '..', 'file');

        return moduleWatcher(options, context).then(assets => {

            let mod = assets.modules[name];

            assert.deepEqual([name], assets.latest);
            assert.deepEqual('string', typeof assets.revision['../file/script']);

            assert.deepEqual({
                index: 'index.js'
            }, mod.chunks);

            assert.deepEqual([
                'index.js',
                'index.js.map',
                'index.css'
            ], mod.assets);

        });
    });

});
