const path = require('path');
const assert = require('assert');
const worker = require('../../lib/worker');

describe('#worker', () => {
    let cwd = path.join(__dirname, '..', 'file', 'lib', 'worker');

    it('send', () => {
        let TEST_ID = Date.now().toString();
        return worker(`node send.js`, {
            cwd,
            env: {
                TEST_ID
            }
        }).then(data => {
            assert.deepEqual({
                id: TEST_ID
            }, data);
        });
    });

    it('send parallel', () => {
        return Promise.all([
            worker(`node send.js`, {
                cwd,
                env: {
                    TEST_ID: '1'
                }
            }),
            worker(`node send.js`, {
                cwd,
                env: {
                    TEST_ID: '2'
                }
            }),
            worker(`node send.js`, {
                cwd,
                env: {
                    TEST_ID: '3'
                }
            }),
            worker(`node send.js`, {
                cwd,
                env: {
                    TEST_ID: '4'
                }
            })
        ]).then(results => {
            assert.deepEqual([{
                id: '1'
            }, {
                id: '2'
            }, {
                id: '3'
            }, {
                id: '4'
            }], results);
        });
    });

    it('childProcess exec: cwd', () => {
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
        return worker(`cd ${cwd} && node worker-child.js`, {
            timeout: 1
        }).then(() => {
            throw new Error('"timeout" does not work');
        }, () => { });
    });


});