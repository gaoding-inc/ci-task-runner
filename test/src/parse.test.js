const assert = require('assert');
const path = require('path');
const parse = require('../../src/parse');

describe('#parse', () => {

    it('empty', () => {
        assert.deepEqual([], parse({
            modules: []
        }, __dirname));
    });

    it('type:string', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [{
                name: 'lib',
                path: path.resolve(__dirname, 'lib')
            }],
            builder: {
                command: '',
                options: {
                    env: process.env
                }
            },
            order: 0,
            dirty: false
        }], parse({
            modules: ['mod1'],
            dependencies: ['lib']
        }, __dirname));
    });

    it('type:object', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: '/Document/mod1',
            dependencies: [{
                name: 'lib',
                path: '/Document/lib'
            }],
            builder: {
                command: '',
                options: {
                    env: process.env
                }
            },
            order: 0,
            dirty: false
        }], parse({
            modules: [{
                name: 'mod1',
                path: '/Document/mod1'
            }],
            dependencies: [{
                name: 'lib',
                path: '/Document/lib'
            }]
        }, __dirname));
    });

    it('serial', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [],
            builder: {
                command: '',
                options: {
                    env: process.env
                }
            },
            order: 0,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            builder: {
                command: '',
                options: {
                    env: process.env
                }
            },
            order: 1,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            builder: {
                command: '',
                options: {
                    env: process.env
                }
            },
            order: 2,
            dirty: false
        }], parse({
            modules: ['mod1', 'mod2', 'mod2']
        }, __dirname));
    });

    it('serial & parallel', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [],
            builder: {
                command: '',
                options: {
                    env: process.env
                }
            },
            order: 0,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            builder: {
                command: '',
                options: {
                    env: process.env
                }
            },
            order: 1,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            builder: {
                command: '',
                options: {
                    env: process.env
                }
            },
            order: 1,
            dirty: false
        }], parse({
            modules: ['mod1', ['mod2', 'mod2']]
        }, __dirname));
    });

    it('inherit', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [{
                name: 'lib',
                path: path.resolve(__dirname, 'lib')
            }],
            builder: {
                command: 'webpack --config mod1/webpack.config.js',
                options: {
                    env: process.env
                }
            },
            order: 0,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [{
                name: 'lib2',
                path: path.resolve(__dirname, 'lib2')
            }, {
                name: 'lib',
                path: path.resolve(__dirname, 'lib')
            }],
            builder: {
                command: 'gulp',
                options: {
                    env: process.env
                }
            },
            order: 1,
            dirty: false
        }], parse({
            modules: ['mod1', {
                name: 'mod2',
                dependencies: ['lib2'],
                builder: {
                    command: 'gulp'
                }
            }],
            dependencies: ['lib'],
            builder: {
                command: 'webpack --config mod1/webpack.config.js'
            }
        }, __dirname));
    });

    it('variables', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [{
                name: 'lib',
                path: path.resolve(__dirname, 'lib')
            }],
            builder: {
                command: 'echo "mod1:' + path.resolve(__dirname, 'mod1') + '"',
                options: {
                    env: Object.assign({}, process.env, {
                        MODULE_NAME: 'mod1'
                    })
                }
            },
            order: 0,
            dirty: false
        }], parse({
            modules: ['mod1'],
            dependencies: ['lib'],
            builder: {
                command: 'echo "${moduleName}:${modulePath}"',
                options: {
                    env: {
                        MODULE_NAME: '${moduleName}'
                    }
                }
            }
        }, __dirname));
    });

});