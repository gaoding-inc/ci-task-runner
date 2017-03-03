const path = require('path');
const template = require('../lib/template');
const defaultsDeep = require('lodash.defaultsdeep');
const DEFAULT = require('./config/config.program.default.json');

class File {
    constructor({name, path}) {
        this.name = name;
        this.path = path;
    }
}

class Dependencie extends File {
    constructor({name, path}) {
        super({ name, path });
    }
}

class Program {
    constructor({command, options}) {
        this.command = command;
        this.options = options;
    }
}

class Task extends File {
    constructor({name, path, dependencies, program, order, dirty}) {
        super({ name, path });
        this.dependencies = dependencies.map(lib => new Dependencie(lib));
        this.program = new Program(program);
        this.order = order;
        this.dirty = dirty;
    }
}


/**
 * 创建 Task 模型
 * @param   {Object}    options
 * @param   {string}    context     上下文路径
 * @return  {Task[]}
 */
module.exports = (options, context) => {
    let tasks = [];


    let parseDependencie = lib => {
        if (typeof lib === 'string') {
            lib = {
                name: lib,
                path: path.resolve(context, lib)
            };
        }

        lib.path = path.resolve(context, lib.path || lib.name);

        return lib;
    };


    let parseProgram = program => {
        if (typeof program === 'string') {
            program = {
                command: program,
                options: {}
            };
        }

        return program;
    }


    // 设置字符串变量
    let setVariables = (target, variables) => {
        let type = typeof target;
        if (type === 'string') {
            return template(target, variables);
        } else if (Array.isArray(target)) {
            return target.map(target => setVariables(target, variables));
        } else if (type === 'object' && type !== null) {
            let object = {};
            Object.keys(target).forEach(key => object[key] = setVariables(target[key], variables));
            return object;
        } else {
            return target;
        }
    };


    let parseTask = (task, order) => {

        if (typeof task === 'string') {
            task = {
                name: task,
                dependencies: [],
                program: {}
            };
        }


        task = {
            name: task.name,
            path: path.resolve(context, task.path || task.name),
            dependencies: [].concat(task.dependencies || [], options.dependencies || []),
            program: defaultsDeep({},
                parseProgram(task.program),
                parseProgram(options.program),
                DEFAULT
            )
        };

        let dependencies = task.dependencies.map(parseDependencie);
        let program = setVariables(task.program, {
            taskName: task.name,
            taskPath: task.path,
            taskDirname: path.dirname(task.path)
        });

        return new Task({
            name: task.name,
            path: task.path,
            dependencies,
            program,
            order,
            dirty: false
        });
    };

    let each = (task, index) => {
        if (Array.isArray(task)) {
            task.forEach(task => each(task, index));
        } else {
            tasks.push(parseTask(task, index));
        }
    };

    options.tasks.forEach(each);

    return tasks;
};