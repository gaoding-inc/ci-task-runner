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

class Program {
    constructor({command, options}) {
        this.command = command;
        this.options = options;
    }
}

class Module extends File {
    constructor({name, path, dependencies, program, order, dirty}) {
        super({ name, path });
        this.dependencies = dependencies.map(library => new File(library));
        this.program = new Program(program);
        this.order = order;
        this.dirty = dirty;
    }
};


/**
 * 构建 Module 对象
 * @param   {Object}    options
 * @param   {string}    context     上下文路径
 * @return  {Module[]}
 */
module.exports = (options, context) => {
    let modules = [];


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


    let parseModule = (mod, order) => {

        if (typeof mod === 'string') {
            mod = {
                name: mod,
                dependencies: [],
                program: {}
            };
        }


        mod = {
            name: mod.name,
            path: path.resolve(context, mod.path || mod.name),
            dependencies: [].concat(mod.dependencies || [], options.dependencies || []),
            program: defaultsDeep({},
                parseProgram(mod.program),
                parseProgram(options.program),
                DEFAULT
            )
        };

        let dependencies = mod.dependencies.map(parseDependencie);
        let program = setVariables(mod.program, {
            moduleName: mod.name,
            modulePath: mod.path,
            moduleDirname: path.dirname(mod.path)
        });

        return new Module({
            name: mod.name,
            path: mod.path,
            dependencies,
            program,
            order,
            dirty: false
        });
    };

    let each = (mod, index) => {
        if (Array.isArray(mod)) {
            mod.forEach(mod => each(mod, index));
        } else {
            modules.push(parseModule(mod, index));
        }
    };

    options.modules.forEach(each);

    return modules;
};