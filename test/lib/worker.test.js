const path = require('path');
const assert = require('assert');
const worker = require('../../lib/worker');

describe('#worker', () => {

    it('send', () => {
        let cwd = path.join(__dirname, '..', 'file', 'script');
        let TEST_ID = Date.now().toString();
        return worker(`node worker-child.js`, {
            cwd,
            env: {
                TEST_ID
            }
        }).then(data => {
            assert.deepEqual({
                cwd,
                id: TEST_ID
            }, data);
        });
    });

    it('childProcess exec: cwd', () => {
        let cwd = path.join(__dirname, '..', 'file', 'script');
        let TEST_ID = Date.now().toString();

        return worker(`cd ${cwd} && node worker-child.js`, {
            env: {
                TEST_ID
            }
        }).then(data => {
            assert.deepEqual({
                cwd,
                id: TEST_ID
            }, data);
        });
    });

});