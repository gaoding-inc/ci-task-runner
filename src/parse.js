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
    let createModule = (mod, order) => {

        let name = mod.name;
        let modPath = path.resolve(context, name);
        let assetsPath = path.resolve(context, options.assets);
        let dependencies = defaultsDeep(mod.dependencies, options.dependencies).map(library => {
            return {
                name: library,
                path: path.resolve(context, library)
            };
        });
        let builder = defaultsDeep({
            options: {
                // 继承父进程的环境变量
                env: process.env
            }
        }, mod.builder, options.builder);

        let variables = {
            moduleName: name,
            modulePath: modPath,
            assetsPath: assetsPath
        };
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

        builder = setVariables(builder);

        return new Module({
            name,
            path: modPath,
            dependencies,
            builder,
            order,
            dirty: false
        });
    };

    let each = (mod, index) => {
        if (Array.isArray(mod)) {
            mod.forEach(mod => each(mod, index));
            return;
        }

        if (typeof mod === 'string') {
            mod = {
                name: mod,
                dependencies: [],
                builder: {}
            };
        }

        modules.push(createModule(mod, index));
    };

    options.modules.forEach(each);

    return modules;
};