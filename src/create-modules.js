const path = require('path');
const template = require('./lib/template');
const getNodeModulePath = require('./lib/get-node-module-path');
const defaultsDeep = require('lodash.defaultsdeep');
const DEFAULT = require('./config/config.default.json');


class File {
    constructor({name, path}) {
        this.name = name;
        this.path = path;
    }
}

class Builder extends File {
    constructor({name, path, timeout, cwd, env, execArgv, silent, launch}) {
        super({ name, path });
        this.timeout = timeout;
        this.cwd = cwd;
        this.env = env;
        this.execArgv = execArgv;
        this.silent = silent;
        this.launch = launch;
    }
}

class Module extends File {
    constructor({name, path, librarys, builder, level, dirty}) {
        super({ name, path });
        this.librarys = librarys.map(library => new File(library));
        this.builder = new Builder(builder);
        this.level = level;
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
    options = defaultsDeep({}, options, DEFAULT);
    let modules = [];
    let createModule = (mod, level) => {

        let name = mod.name;
        let librarys = defaultsDeep(mod.librarys, options.librarys).map(library => {
            return {
                name: library,
                path: path.resolve(context, library)
            };
        });
        let builder = defaultsDeep(mod.builder, options.builder);


        // builder 设置变量，路径相关都转成绝对路径
        let data = { moduleName: mod.name };
        builder.cwd = path.resolve(context, template(builder.cwd, data));
        builder.launch = path.resolve(context, template(builder.launch, data));
        builder.execArgv = builder.execArgv.map(argv => template(argv, data));
        Object.keys(builder.env).forEach(key => builder.env[key] = template(builder.env[key], data));
        builder.path = getNodeModulePath(builder.name, builder.cwd);

        return new Module({
            name,
            path: path.resolve(context, name),
            librarys,
            builder,
            level,
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
                librarys: [],
                builder: {}
            };
        }

        modules.push(createModule(mod, index));
    };

    options.modules.forEach(each);

    return modules;
};