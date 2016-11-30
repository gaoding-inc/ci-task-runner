const assert = require('assert');
const promiseTask = require('../../lib/promise-task');

describe('#promise-task', () => {

    const delay = (fuc, time) => {
        return new Promise(results => {
            setTimeout(() => {
                results(fuc());
            }, time);
        });
    }

    describe('#promise-task.serial', () => {

        it('results', () => {
            return promiseTask.serial([
                0,
                (result) => {
                    assert.deepEqual(0, result)
                    return 1;
                },
                (result) => {
                    assert.deepEqual(1, result)
                    return 2;
                },
                (result) => {
                    assert.deepEqual(2, result)
                    return 3;
                }
            ]).then((results) => {
                assert.deepEqual([0, 1, 2, 3], results)
            });
        });

        it('order', () => {
            return promiseTask.serial([
                0,
                () => {
                    return delay(() => 1, 30);
                },
                () => {
                    return delay(() => 2, 35);
                },
                () => {
                    return delay(() => 3, 0);
                }
            ]).then((results) => {
                assert.deepEqual([0, 1, 2, 3], results)
            });
        });

        it('Promise reject', () => {
            return promiseTask.serial([
                () => 0,
                () => 1,
                () => Promise.reject(2),
                () => 3
            ]).catch(function (error) {
                assert.deepEqual(2, error)
            });
        });

        it('Function error', () => {
            return promiseTask.serial([
                () => 0,
                () => 1,
                () => {
                    throw Error('Function error');
                },
                () => 3
            ]).catch(function (error) {
                assert.deepEqual('Function error', error.message)
            });
        });

    });


    describe('#promise-task.parallel', () => {
        const limit = 2;

        it('results', () => {
            return promiseTask.parallel([
                () => 0,
                () => 1,
                () => 2,
                () => 3
            ], limit).then((results) => {
                assert.deepEqual([0, 1, 2, 3], results);
            });
        });

        it('order', () => {
            return promiseTask.parallel([
                () => {
                    return delay(() => 0, 40);
                },
                () => {
                    return delay(() => 1, 30);
                },
                () => {
                    return delay(() => 2, 35);
                },
                () => {
                    return delay(() => 3, 0);
                }
            ], limit).then((results) => {
                assert.deepEqual([0, 1, 2, 3], results)
            });
        });

        it('Promise reject', () => {
            return promiseTask.parallel([
                () => 0,
                () => 1,
                () => Promise.reject(2),
                () => 3
            ], limit).then(() => {
                throw new Error('error');
            }).catch(function (error) {
                assert.deepEqual(2, error)
            });
        });


        it('Function error', () => {
            return promiseTask.parallel([
                () => 0,
                () => 1,
                () => {
                    throw Error('Function error');
                },
                () => 3
            ], limit).then(() => {
                throw new Error('error');
            }).catch(function (error) {
                assert.deepEqual('Function error', error.message)
            });
        });


        it('Function error', () => {
            return promiseTask.parallel([
                null,
                undefined,
                {},
                []
            ], limit).then(() => {
                throw new Error('error');
            }).catch(function (errors) {
                assert.deepEqual('object', typeof errors)
            });
        });


    });

});