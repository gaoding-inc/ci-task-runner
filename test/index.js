'use strict';
const assert = require('assert');
const promiseTask = require('../src/lib/promise-task');


describe('lib', function () {

    const delay = (fuc, time) => {
        return new Promise((results, reject) => {
            setTimeout(() => {
                results(fuc());
            }, time);
        });
    }

    describe('#promise-task.serial', function () {

        it('results', function () {
            return promiseTask.serial([
                () => 0,
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

        it('order', function () {
            return promiseTask.serial([
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
            ]).then((results) => {
                assert.deepEqual([0, 1, 2, 3], results)
            });
        });

        it('Promise reject', function () {
            return promiseTask.serial([
                () => 0,
                () => 1,
                () => Promise.reject(2),
                () => 3
            ]).catch(function (error) {
                assert.deepEqual(2, error)
            });
        });

        it('Function error', function () {
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


    describe('#promise-task.parallel', function () {
        const limit = 2;

        it('results', function () {
            return promiseTask.parallel([
                () => 0,
                () => 1,
                () => 2,
                () => 3
            ], limit).then((results) => {
                assert.deepEqual([0, 1, 2, 3], results);
            });
        });

        it('order', function () {
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

        it('Promise reject', function () {
            return promiseTask.parallel([
                () => 0,
                () => 1,
                () => Promise.reject(2),
                () => 3
            ], limit).catch(function (error) {
                assert.deepEqual(2, error)
            });
        });


        it('Function error', function () {
            return promiseTask.parallel([
                () => 0,
                () => 1,
                () => {
                    throw Error('Function error');
                },
                () => 3
            ], limit).catch(function (error) {
                assert.deepEqual('Function error', error.message)
            });
        });


    });

});