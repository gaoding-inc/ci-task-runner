const assert = require('assert');
const path = require('path');
const taskRunner = require('../../src/index');


describe('#index', () => {

    let name = 'index';
    let context = path.join(__dirname, '..', 'file', 'src');

    it('taskRunner.send()', () => {
        let options = {
            modules: [name],
            assets: path.join(context, 'dist', 'assets.json'),
            program: 'node ${modulePath}/send.js'
        };

        return taskRunner(options, context).then(assets => {

            let mod = assets.modules[name];

            assert.deepEqual([name], assets.latest);
            assert.deepEqual('string', typeof assets.revision['../index']);

            assert.deepEqual({
                index: '../index/dist/index.js'
            }, mod.chunks);

            assert.deepEqual([
                '../index/dist/index.js',
                '../index/dist/index.js.map',
                '../index/dist/index.css'
            ], mod.assets);

        });
    });

    it('taskRunner.send(): program.command', () => {
        let options = {
            modules: [name],
            assets: path.join(context, 'dist', 'assets.json'),
            program: {
                command: 'node ${modulePath}/send.js'
            }
        };

        return taskRunner(options, context).then(assets => {

            let mod = assets.modules[name];

            assert.deepEqual([name], assets.latest);
            assert.deepEqual('string', typeof assets.revision['../index']);

            assert.deepEqual({
                index: '../index/dist/index.js'
            }, mod.chunks);

            assert.deepEqual([
                '../index/dist/index.js',
                '../index/dist/index.js.map',
                '../index/dist/index.css'
            ], mod.assets);

        });
    });

});
