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


    it('childProcess exec: env inherit', () => {
        let cwd = path.join(__dirname, '..', 'file', 'script');
        let TEST_ID = Date.now().toString();

        process.env.TEST_ID = TEST_ID;

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

    it('childProcess exec: env rewrite', () => {
        let cwd = path.join(__dirname, '..', 'file', 'script');
        let TEST_ID = Date.now().toString();

        process.env.TEST_ID = 'hello';

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

    it('childProcess exec: timeout', () => {
        let cwd = path.join(__dirname, '..', 'file', 'script');

        return worker(`cd ${cwd} && node worker-child.js`, {
            timeout: 1
        }).then(() => {
            throw new Error('"timeout" does not work');
        }, () => {});
    });

});