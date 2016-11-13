'use strict';

const path = require('path');
const getBuildVersion = require('./get-build-version');

/**
 * 模块脏检查
 * @param   {Object}      module   模块配置
 * @param   {string}      context  基准目录
 * @return  {Object[]}             模块编译版本号与变更状态
 */
module.exports = (module, context = process.cwd()) => {

    let diffVersion = target => {
        let version = getBuildVersion(target);
        let dirty = version !== getBuildVersion(path.join(target, '..'));
        return { dirty, version };
    };

    let diff = diffVersion(path.join(context, module.name));
    let modified = diff.dirty || module.dependencies.map(target => {
        return diffVersion(path.join(context, target)).dirty
    }).includes(true);

    module.$dirty = modified;
    module.$version = diff.version;

    return module;
};