'use strict';

const path = require('path');
const childProcess = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const getBuildVersion = require('./get-build-version');

/**
 * 模块脏检查
 * @param   {Object}           options                        配置
 * @param   {Object[]|string}  options.modules                模块组
 * @param   {Object}           options.modules.name           模块名
 * @param   {string[]}         options.modules.dependencies   模块依赖
 * @param   {string[]}         options.dependencies           模块组公共依赖
 * @param   {string}           cwd                            git 运行的工作目录
 * @return  {Object[]}                                        模块编译版本号与变更状态
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
 *   ]
 * })
 */
module.exports = (
    options = {},
    cwd = process.cwd()
) => {

    // 主版本号
    let mainVersion = getBuildVersion(cwd);

    // 全局依赖是否有变更
    let mainModified = (options.dependencies || [])
        .map(d => getBuildVersion(path.resolve(cwd, d)) !== mainVersion)
        .includes(true);

    return (options.modules || []).map((mod) => {

        if (typeof mod === 'string') {
            mod = {
                name: mod,
                dependencies: []
            }
        }

        const version = getBuildVersion(path.resolve(cwd, mod.name));

        if (mainModified || version !== mainVersion || (mod.dependencies || [])
            .map(d => getBuildVersion(path.resolve(cwd, d)) !== mainVersion)
            .includes(true)) {
            return {
                name: mod.name,
                version,
                dirty: true
            };
        } else {
            return {
                name: mod.name,
                version,
                dirty: false
            };
        }

    });
};



