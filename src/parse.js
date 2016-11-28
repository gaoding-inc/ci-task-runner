const path = require('path');
const template = require('../lib/template');
const defaultsDeep = require('lodash.defaultsdeep');

class File {
    constructor({name, path}) {
        this.name = name;
        this.path = path;
    }
}

class Builder {
    constructor({command, options}) {
        this.command = command;
        this.options = options;
    }
}

class Module extends File {
    constructor({name, path, dependencies, builder, order, dirty}) {
        super({ name, path });
        this.dependencies = dependencies.map(library => new File(library));
        this.builder = new Builder(builder);
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

        if (!lib.path) {
            lib.path = path.resolve(context, lib);
        }

        return lib;
    };


    let parseModule = (mod, order) => {

        if (typeof mod === 'string') {
            mod = {
                name: mod,
                dependencies: [],
                builder: {}
            };
        }

        mod = {
            name: mod.name,
            path: mod.path || path.resolve(context, mod.name),
            dependencies: [].concat(mod.dependencies || [], options.dependencies || []),
            builder: defaultsDeep({}, mod.builder, options.builder, {
                command: '',
                options: {
                    env: process.env // 使用父进程的环境变量
                }
            })
        };
        

        let variables = {
            moduleName: mod.name,
            modulePath: mod.path
        };

        // 设置字符串变量
        let setVariables = target => {
            let type = typeof target;
            if (type === 'string') {
                return template(target, variables);
            } else if (Array.isArray(target)) {
                return target.map(setVariables);
            } else if (type === 'object' && type !== null) {
                let object = {};
                Object.keys(target).forEach(key => object[key] = setVariables(target[key]));
                return object;
            }
        };

        let dependencies = mod.dependencies.map(parseDependencie);
        let builder = setVariables(mod.builder);

        return new Module({
            name: mod.name,
            path: mod.path,
            dependencies,
            builder,
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