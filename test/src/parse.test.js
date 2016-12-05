const assert = require('assert');
const path = require('path');
const parse = require('../../src/parse');
const defaultsDeep = require('lodash.defaultsdeep');


describe('#parse', () => {

    const programDefaults = (name, context) => {
        return defaultsDeep({
            options: {
                env: process.env
            }
        }, {
                command: '',
                options: {
                    timeout: 0,
                    env: {
                        'MODULE_WATCHER': '1',
                        'MODULE_WATCHER_MODULE_NAME': name,
                        'MODULE_WATCHER_MODULE_PATH': path.resolve(context, name),
                        'MODULE_WATCHER_MODULE_DIRNAME': context
                    }
                }
            })
    };

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
            program: programDefaults('mod1', __dirname),
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
            program: defaultsDeep({
                command: 'node build.js'
            }, programDefaults('mod1', __dirname)),
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
            program: programDefaults('mod1', __dirname),
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
            program: programDefaults('mod1', __dirname),
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
            program: programDefaults('mod1', __dirname),
            order: 0,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            program: programDefaults('mod2', __dirname),
            order: 1,
            dirty: false
        }, {
            name: 'mod3',
            path: path.resolve(__dirname, 'mod3'),
            dependencies: [],
            program: programDefaults('mod3', __dirname),
            order: 2,
            dirty: false
        }], parse({
            modules: ['mod1', 'mod2', 'mod3']
        }, __dirname));
    });

    it('serial & parallel', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [],
            program: programDefaults('mod1', __dirname),
            order: 0,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            program: programDefaults('mod2', __dirname),
            order: 1,
            dirty: false
        }, {
            name: 'mod3',
            path: path.resolve(__dirname, 'mod3'),
            dependencies: [],
            program: programDefaults('mod3', __dirname),
            order: 1,
            dirty: false
        }], parse({
            modules: ['mod1', ['mod2', 'mod3']]
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
            program: defaultsDeep({
                command: 'webpack --config mod1/webpack.config.js',
            }, programDefaults('mod1', __dirname)),
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
            program: defaultsDeep({
                command: 'gulp'
            }, programDefaults('mod2', __dirname)),
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
            program: defaultsDeep({
                command: 'webpack --config mod1/webpack.config.js'
            }, programDefaults('mod2', __dirname))
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
            program: defaultsDeep({
                command: 'echo "mod1:' + path.resolve(__dirname, 'mod1') + '"',
                options: {
                    env: {
                        MODULE_NAME: 'mod1'
                    }
                }
            }, programDefaults('mod1', __dirname)),
            order: 0,
            dirty: false
        }], parse({
            modules: ['mod1'],
            dependencies: ['lib'],
            program: defaultsDeep({
                command: 'echo "${moduleName}:${modulePath}"',
                options: {
                    env: {
                        MODULE_NAME: '${moduleName}'
                    }
                }
            }, programDefaults('mod1', __dirname))
        }, __dirname));
    });

});