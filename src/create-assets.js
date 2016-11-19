const path = require('path');
const fsp = require('fs-promise');
const defaultsDeep = require('lodash.defaultsdeep');
const readAssets = require('./read-assets');
const ASSETS_DEFAULT_NAME = './config/assets.default.json';
const ASSETS_DEFAULT = require(ASSETS_DEFAULT_NAME);


module.exports = (assetsPath, modulesAssets, latestCommit) => {

    let modulesMap = {};
    let librarysCommit = {};

    modulesAssets.forEach(mod => {
        let name = mod.name;
        mod.commit = latestCommit[name];
        modulesMap[name] = mod;
        librarysCommit[name] = latestCommit[name];
        delete modulesMap[name].name;
    });

    let assetsContent = defaultsDeep({}, {
        librarys: librarysCommit
    }, ASSETS_DEFAULT);

    assetsContent.date = (new Date()).toLocaleString();
    assetsContent.modules = modulesMap;

    // 保存资源索引文件（TIPS: 为了保证有效性，要第一时间读取最新描述文件再写入）
    return readAssets(assetsPath).then(preAssetsContent => {

        let modulesMap = assetsContent.modules;
        let relative = file => path.relative(path.dirname(assetsPath), file);
        let latest = []

        Object.keys(modulesMap).forEach(name => {

            latest.push(name);

            let preModMap = preAssetsContent.modules[name];
            let mod = modulesMap[name];
            let chunks = mod.chunks;
            let assets = mod.assets;

            // 自动递增模块的编译版本号
            if (preModMap) {
                mod.version = preModMap.version + 1;
            }

            // 将绝对路径转换为相对与资源描述文件的路径
            Object.keys(chunks).forEach(name => chunks[name] = relative(chunks[name]));
            assets.forEach((file, index) => assets[index] = relative(file));

        });

        Object.assign(preAssetsContent.modules, modulesMap);
        Object.assign(preAssetsContent.librarys, assetsContent.librarys);
        preAssetsContent.version = (Number(preAssetsContent.version) || 0) + 1;
        preAssetsContent.latest = latest;
        preAssetsContent.date = (new Date()).toLocaleString();

        let newAssetsContentText = JSON.stringify(preAssetsContent, null, 2);

        return fsp.writeFile(assetsPath, newAssetsContentText, 'utf8').then(() => preAssetsContent);

    })
}