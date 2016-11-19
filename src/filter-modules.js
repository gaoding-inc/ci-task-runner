const color = require('cli-color');

/**
 * 筛选模块目录
 * @param   {Object[]}    modules     模块列表
 * @param   {function}    diff        比较函数
 */
module.exports = (modules, diff) => {
    let list = [];

    let filter = mod => {
        let moduleChaned = diff(mod.name);
        let librarysChanged = mod.librarys.filter(name => {
            return diff(name);
        }).length !== 0;

        if (mod.builder.force || librarysChanged || moduleChaned) {
            return true;
        } else {
            console.log(color.yellow(`\n[task:ignore] name: ${mod.name}\n`));
            return false;
        }
    };

    modules.forEach(mod => {
        if (Array.isArray(mod)) {
            list.push(mod.filter(filter));
        } else if (filter(mod)) {
            list.push(mod);
        }
    });

    return list;
};