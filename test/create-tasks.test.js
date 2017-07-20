const assert = require('assert');
const path = require('path');
const createTasks = require('../src/create-tasks');
const defaultsDeep = require('lodash.defaultsdeep');


describe('#create-tasks', () => {

    const programDefaults = (options, context) => {
        let p = path.resolve(context, options.path || options.name);
        return {
            command: '',
            options: {
                timeout: 0,
                env: {
                    'CI_TASK_RUNNER': '1',
                    'CI_TASK_RUNNER_TASK_NAME': options.name,
                    'CI_TASK_RUNNER_TASK_PATH': p,
                    'CI_TASK_RUNNER_TASK_DIRNAME': path.dirname(p)
                }
            }
        };
    };

    it('empty', () => {
        assert.deepEqual([], createTasks({
            tasks: []
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
            program: programDefaults({ name: 'mod1' }, __dirname),
            order: 0,
            dirty: false
        }], createTasks({
            tasks: ['mod1'],
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
            }, programDefaults({ name: 'mod1' }, __dirname)),
            order: 0,
            dirty: false
        }], createTasks({
            tasks: ['mod1'],
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
            program: programDefaults({ name: 'mod1' }, __dirname),
            order: 0,
            dirty: false
        }], createTasks({
            tasks: [{
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
            program: programDefaults({
                name: 'mod1',
                path: path.resolve(__dirname, 'map', 'mod1'),
            }, __dirname),
            order: 0,
            dirty: false
        }], createTasks({
            tasks: [{
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
            program: programDefaults({ name: 'mod1' }, __dirname),
            order: 0,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            program: programDefaults({ name: 'mod2' }, __dirname),
            order: 1,
            dirty: false
        }, {
            name: 'mod3',
            path: path.resolve(__dirname, 'mod3'),
            dependencies: [],
            program: programDefaults({ name: 'mod3' }, __dirname),
            order: 2,
            dirty: false
        }], createTasks({
            tasks: ['mod1', 'mod2', 'mod3']
        }, __dirname));
    });

    it('serial & parallel', () => {
        assert.deepEqual([{
            name: 'mod1',
            path: path.resolve(__dirname, 'mod1'),
            dependencies: [],
            program: programDefaults({ name: 'mod1' }, __dirname),
            order: 0,
            dirty: false
        }, {
            name: 'mod2',
            path: path.resolve(__dirname, 'mod2'),
            dependencies: [],
            program: programDefaults({ name: 'mod2' }, __dirname),
            order: 1,
            dirty: false
        }, {
            name: 'mod3',
            path: path.resolve(__dirname, 'mod3'),
            dependencies: [],
            program: programDefaults({ name: 'mod3' }, __dirname),
            order: 1,
            dirty: false
        }], createTasks({
            tasks: ['mod1', ['mod2', 'mod3']]
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
            }, programDefaults({ name: 'mod1' }, __dirname)),
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
            }, programDefaults({ name: 'mod2' }, __dirname)),
            order: 1,
            dirty: false
        }], createTasks({
            tasks: ['mod1', {
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
            program: defaultsDeep({
                command: 'echo "mod1:' + path.resolve(__dirname, 'mod1') + '"',
                options: {
                    env: {
                        TASK_NAME: 'mod1'
                    }
                }
            }, programDefaults({ name: 'mod1' }, __dirname)),
            order: 0,
            dirty: false
        }], createTasks({
            tasks: ['mod1'],
            dependencies: ['lib'],
            program: defaultsDeep({
                command: 'echo "${taskName}:${taskPath}"',
                options: {
                    env: {
                        TASK_NAME: '${taskName}'
                    }
                }
            }, programDefaults({ name: 'mod1' }, __dirname))
        }, __dirname));
    });

});