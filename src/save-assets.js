const path = require('path');
const fsp = require('../lib/fs-promise');
const defaultsDeep = require('lodash.defaultsdeep');
const readAssets = require('./read-assets');
const ASSETS_DEFAULT_NAME = './config/assets.default.json';
const ASSETS_DEFAULT = require(ASSETS_DEFAULT_NAME);


module.exports = (assetsPath, modulesAssets) => {
    // 并行写配置需要第一时间读取再操作
    return readAssets(assetsPath).then(preAssetsContent => {

        let modulesMap = {};
        let latest = [];
        let assetsDiranme = path.dirname(assetsPath);
        let relative = file => path.relative(assetsDiranme, file);

        modulesAssets.forEach(mod => {
            let name = mod.name;
            let preModMap = preAssetsContent.modules[name];
            let chunks = mod.chunks;
            let assets = mod.assets;

            // 编译版本号
            mod.version =  preModMap ? preModMap.version + 1 : 1;

            // 编译时间
            mod.date = (new Date()).toLocaleString();

            // 转换为相对路径
            Object.keys(chunks).forEach(name => chunks[name] = relative(chunks[name]));
            assets.forEach((file, index) => assets[index] = relative(file));

            latest.push(name);
            modulesMap[name] = mod;
            delete modulesMap[name].name;
        });

        let assetsContent = Object.assign({}, ASSETS_DEFAULT, preAssetsContent, {
            version: (Number(preAssetsContent.version) || 0) + 1,
            date: (new Date()).toLocaleString(),
            latest: latest,
            modules: defaultsDeep(modulesMap, preAssetsContent.modules)
        });

        let data = JSON.stringify(assetsContent, null, 2);
        return fsp.writeFile(assetsPath, data, 'utf8').then(() => assetsContent);
    })
}