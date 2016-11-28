const path = require('path');
const fsp = require('../lib/fs-promise');
const defaultsDeep = require('lodash.defaultsdeep');
const ASSETS_DEFAULT = require('./config/assets.default.json');

const mergeAssets = (newAssets, oldAssets, assetsPath) => {
    let modulesMap = {};
    let latest = [];
    let assetsDiranme = path.dirname(assetsPath);
    let relative = file => path.relative(assetsDiranme, file);

    newAssets.forEach(mod => {
        let name = mod.name;
        let preModMap = oldAssets.modules[name];
        let chunks = mod.chunks;
        let assets = mod.assets;

        // 编译版本号
        mod.version = preModMap ? preModMap.version + 1 : 1;

        // 编译时间
        mod.date = (new Date()).toLocaleString();

        // 转换为相对路径
        Object.keys(chunks).forEach(name => chunks[name] = relative(chunks[name]));
        assets.forEach((file, index) => assets[index] = relative(file));

        latest.push(name);
        modulesMap[name] = mod;
        delete modulesMap[name].name;
    });

    oldAssets.version = (Number(oldAssets.version) || 0) + 1;
    oldAssets.date = (new Date()).toLocaleString();
    oldAssets.latest = latest;
    oldAssets.modules = Object.assign(oldAssets.modules, modulesMap);

    return oldAssets;
};


// 并行写配置需要第一时间读取再操作
module.exports = (assetsPath, newAssets) => fsp.readFile(assetsPath, 'utf8')
    .catch(() => JSON.stringify(ASSETS_DEFAULT, null, 2))
    .then(json => JSON.parse(json))
    .then(oldAssets => {
        defaultsDeep(oldAssets, ASSETS_DEFAULT);
        let assetsContent = mergeAssets(newAssets, oldAssets, assetsPath);
        let data = JSON.stringify(assetsContent, null, 2);
        return fsp.writeFile(assetsPath, data, 'utf8').then(() => assetsContent);
    });