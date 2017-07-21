const assert = require('assert');
const queue = require('../src/queue');

describe('#queue', () => {

    const delay = (fuc, time) => {
        return new Promise(results => {
            setTimeout(() => {
                results(fuc());
            }, time);
        });
    }

    describe('#queue.serial', () => {

        it('results', () => {
            return queue.serial([
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
            return queue.serial([
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
            return queue.serial([
                () => 0,
                () => 1,
                () => Promise.reject(2),
                () => 3
            ]).catch(function (error) {
                assert.deepEqual(2, error)
            });
        });

        it('Function error', () => {
            return queue.serial([
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


    describe('#queue.parallel', () => {
        const limit = 2;

        it('results', () => {
            return queue.parallel([
                () => 0,
                () => 1,
                () => 2,
                () => 3
            ], limit).then((results) => {
                assert.deepEqual([0, 1, 2, 3], results);
            });
        });

        it('order', () => {
            return queue.parallel([
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
            return queue.parallel([
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
            return queue.parallel([
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
            return queue.parallel([
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