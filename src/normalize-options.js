const defaultsDeep = require('lodash.defaultsdeep');
const DEFAULT = require('./config/config.default.json');


/**
 * 标准化配置
 * @param   {Object}    options 
 * @return  {Object}
 */
module.exports = options => {
    options = defaultsDeep({}, options, DEFAULT);
    
    let normalize = mod => {
        // 转换字符串形式的格式
        if (typeof mod === 'string') {
            mod = { name: mod, librarys: [], builder: {} };
        } else if (Array.isArray(mod)) {
            return mod.map(normalize);
        }

        // 模块继承父设置
        defaultsDeep(mod.librarys, options.librarys);
        defaultsDeep(mod.builder, options.builder);

        return mod;
    };

    options.modules = options.modules.map(normalize);
    return options;
};