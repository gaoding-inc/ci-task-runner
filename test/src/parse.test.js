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
            program: {
                command: '',
                options: {}
            },
            order: 0,
            dirty: false
        }], parse({
            modules: ['mod1'],
            dependencies: ['lib']
        }, __dirname));
    });


    it('type:program:string', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [{
                name: 'lib',
                path: path.resolve(__dirname, 'lib')
            }],
            program: {
                command: 'node build.js',
                options: {}
            },
            order: 0,
            dirty: false
        }], parse({
            modules: ['mod1'],
            dependencies: ['lib'],
            program: 'node build.js'
        }, __dirname));
    });


    it('type:object', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [{
                name: 'lib',
                path: '/Document/lib'
            }],
            program: {
                command: '',
                options: {}
            },
            order: 0,
            dirty: false
        }], parse({
            modules: [{
                name: 'mod1'
            }],
            dependencies: [{
                name: 'lib',
                path: '/Document/lib'
            }]
        }, __dirname));
    });

    it('path', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'map', 'mod1'),
            dependencies: [{
                name: 'lib',
                path: path.resolve(__dirname, 'map', 'lib')
            }],
            program: {
                command: '',
                options: {}
            },
            order: 0,
            dirty: false
        }], parse({
            modules: [{
                name: 'mod1',
                path: 'map/mod1'
            }],
            dependencies: [{
                name: 'lib',
                path: 'map/lib'
            }]
        }, __dirname));
    });


    it('serial', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [],
            program: {
                command: '',
                options: {}
            },
            order: 0,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            program: {
                command: '',
                options: {}
            },
            order: 1,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            program: {
                command: '',
                options: {}
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
            program: {
                command: '',
                options: {}
            },
            order: 0,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            program: {
                command: '',
                options: {}
            },
            order: 1,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            program: {
                command: '',
                options: {}
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
            program: {
                command: 'webpack --config mod1/webpack.config.js',
                options: {}
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
            program: {
                command: 'gulp',
                options: {}
            },
            order: 1,
            dirty: false
        }], parse({
            modules: ['mod1', {
                name: 'mod2',
                dependencies: ['lib2'],
                program: {
                    command: 'gulp'
                }
            }],
            dependencies: ['lib'],
            program: {
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
            program: {
                command: 'echo "mod1:' + path.resolve(__dirname, 'mod1') + '"',
                options: {
                    env: {
                        MODULE_NAME: 'mod1'
                    }
                }
            },
            order: 0,
            dirty: false
        }], parse({
            modules: ['mod1'],
            dependencies: ['lib'],
            program: {
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