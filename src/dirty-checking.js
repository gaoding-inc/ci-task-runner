'use strict';

const path = require('path');
const getBuildVersion = require('./get-build-version');

/**
 * 模块脏检查
 * @param   {Object[]|string}  modules                模块组
 * @param   {Object}           modules.name           模块名
 * @param   {string[]}         modules.dependencies   模块依赖
 * @param   {string[]}         dependencies           模块组公共依赖
 * @param   {boolean}          force                  强制变脏
 * @param   {string}           context                基准目录
 * @return  {Object[]}                                模块编译版本号与变更状态
 * @example
 * dirty({
 *   "modules": [
 *      "mod1",
 *      {
 *          "name": "mod2",
 *          "dependencies": [
 *              "lib",
 *              "css"
 *          ]
 *       }
 *   ],
 *   "dependencies": [
 *       "package.json"
 *   ],
 *   "force": false,
 * })
 */
module.exports = ({
    modules = [],
    dependencies = [],
    force = false,
    context = process.cwd()
}) => {

    let diffVersion = target => {
        let version = getBuildVersion(target);
        let dirty = version !== getBuildVersion(path.join(target, '..'));
        return { dirty, version };
    };

    // 对比全局依赖
    let modified = force || dependencies.map(target => {
        return diffVersion(path.join(context, target)).dirty
    }).includes(true);

    return modules.map((mod) => {

        if (typeof mod === 'string') {
            mod = {
                name: mod,
                dependencies: []
            }
        }

        // 对比当前模块
        let diff = diffVersion(path.join(context, mod.name));

        if (modified || diff.dirty || (mod.dependencies || []).map(target => {
            // 对比当前模块的依赖
            return path.join(context, target);
        }).includes(true)) {
            return {
                name: mod.name,
                dirty: true,
                version: diff.version
            };
        } else {
            return {
                name: mod.name,
                dirty: false,
                version: diff.version
            };
        }

    });
};