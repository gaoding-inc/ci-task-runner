const assert = require('assert');
const path = require('path');
const taskRunner = require('../../src/index');


describe('#index', () => {

    let name = 'index';
    let context = path.join(__dirname, '..', 'file', 'src');

    it('taskRunner.send()', () => {
        let options = {
            modules: [name],
            cache: path.join(process.env.TEST_DIST, 'src', 'index', '.ci-task-runner-cache.json'),
            program: 'node ${modulePath}/send.js'
        };

        return taskRunner(options, context).then(cache => {

            let buildInfo = cache.modules[name];

            assert.deepEqual([name], cache.latest);
            assert.deepEqual('object', typeof cache.revision);

            assert.deepEqual({
                hello: 'world'
            }, buildInfo);

        });
    });

    it('taskRunner.send(): program.command', () => {
        let options = {
            modules: [name],
            cache: path.join(process.env.TEST_DIST, 'src', 'index', '.ci-task-runner-cache.json'),
            program: {
                command: 'node ${modulePath}/send.js'
            }
        };

        return taskRunner(options, context).then(cache => {

            let buildInfo = cache.modules[name];

            assert.deepEqual([name], cache.latest);
            assert.deepEqual('object', typeof cache.revision);

            assert.deepEqual({
                hello: 'world'
            }, buildInfo);

        });
    });

});
