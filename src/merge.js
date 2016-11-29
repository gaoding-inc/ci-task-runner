const defaultsDeep = require('lodash.defaultsdeep');


/**
 * 合并资源索引
 * @param   {Object[]}      newAssets       新的资源索引
 * @param   {Object}        oldAssets       旧的资源索引
 * @return  {Object}
 */
module.exports = (newAssets, oldAssets) => {

    newAssets.version = (Number(oldAssets.version) || 0) + 1;
    Object.keys(newAssets.modules).forEach(name => {
        if (oldAssets.modules[name]) {
            newAssets.modules[name].version = (Number(oldAssets.modules[name].version) || 0) + 1;
        }
    });
    
    let assets = defaultsDeep({}, newAssets, oldAssets);
    assets.modules = Object.assign({}, oldAssets.modules, newAssets.modules);
    return assets;
};