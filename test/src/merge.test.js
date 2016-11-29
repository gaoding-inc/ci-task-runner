const assert = require('assert');
const merge = require('../../src/merge');

describe('#merge', () => {

    it('empty', () => {
        assert.deepEqual({
            version: 3,
            date: (new Date()).toLocaleString(),
            latest: [],
            modules: {}
        }, merge({
            version: 0,
            date: (new Date()).toLocaleString(),
            latest: [],
            modules: {}
        }, {
            version: 2,
            date: (new Date()).toLocaleString(),
            latest: [],
            modules: {}
        }));
    });


    it('merge', () => {
        assert.deepEqual({
            version: 3,
            date: (new Date()).toLocaleString(),
            latest: ['mod1'],
            modules: {
                mod1: {
                    version: 5,
                    date: '2016-11-29 09:43:45'
                },
                mod2: {
                    version: 2,
                    other: {
                        messages: 'hello world'
                    }
                }
            },
            other: {
                message: 'new',
                hello: 'world'
            }
        }, merge({
            version: 0,
            date: (new Date()).toLocaleString(),
            latest: ['mod1'],
            modules: {
                mod1: {
                    version: 1,
                    date: '2016-11-29 09:43:45'
                }
            },
            other: {
                message: 'new'
            }
        }, {
            version: 2,
            date: (new Date()).toLocaleString(),
            latest: [],
            modules: {
                mod1: {
                    version: 4,
                    date: '2016-10-00 09:43:45',
                    other: {
                        messages: 'hello world'
                    }
                },
                mod2: {
                    version: 2,
                    other: {
                        messages: 'hello world'
                    }
                }
            },
            other: {
                message: 'old',
                hello: 'world'
            }
        }));
    });

});