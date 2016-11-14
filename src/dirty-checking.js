'use strict';

const path = require('path');
const getBuildVersion = require('./lib/get-build-version');
const VError = require('verror');

/**
 * 模块脏检查
 * @param   {Object}      module   模块配置
 * @param   {string}      context  基准目录
 * @return  {Object[]}             模块编译版本号与变更状态
 */
module.exports = ({name, dependencies}, context = process.cwd()) => {

    let diffVersion = target => {
        let version;
        let errorMessage = `无法获取变更记录，因为目标不在 git 仓库中 "${target}"`;

        try {
            version = getBuildVersion(target);
        } catch(e) {
            throw new VError(e, errorMessage);
        }

        if (!version) {
            throw new VError(errorMessage);
        }
        
        let dirty = version !== getBuildVersion(path.join(target, '..'));
        return { dirty, version };
    };

    let diff = diffVersion(path.join(context, name));
    let version = diff.version;
    let dirty = diff.dirty || dependencies.map(target => {
        return diffVersion(path.join(context, target)).dirty
    }).includes(true);

    return { dirty, version };
};