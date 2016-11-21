const path = require('path');
const fsp = require('fs-promise');
const defaultsDeep = require('lodash.defaultsdeep');
const readAssets = require('./read-assets');
const ASSETS_DEFAULT_NAME = './config/assets.default.json';
const ASSETS_DEFAULT = require(ASSETS_DEFAULT_NAME);


module.exports = (assetsPath, modulesAssets, latestCommit, librarysCommit) => {
    // 并行写配置需要第一时间读取再操作
    return readAssets(assetsPath).then(preAssetsContent => {

        let modulesMap = {};
        let latest = [];
        let relative = file => path.relative(path.dirname(assetsPath), file);

        modulesAssets.forEach(mod => {
            let name = mod.name;
            let preModMap = preAssetsContent.modules[name];
            let chunks = mod.chunks;
            let assets = mod.assets;
            
            // 自动递增模块的编译版本号
            if (preModMap) {
                mod.version = preModMap.version + 1;
            }

            // 将绝对路径转换为相对与资源描述文件的路径
            Object.keys(chunks).forEach(name => chunks[name] = relative(chunks[name]));
            assets.forEach((file, index) => assets[index] = relative(file));
            
            mod.commit = latestCommit[name];

            latest.push(name);
            modulesMap[name] = mod;

            delete modulesMap[name].name;
        });

        let assetsContent = defaultsDeep({
            version: (Number(preAssetsContent.version) || 0) + 1,
            date: (new Date()).toLocaleString(),
            latest: latest,
            modules: modulesMap,
            librarys: librarysCommit
        }, ASSETS_DEFAULT);


        Object.assign(assetsContent.modules, preAssetsContent.modules);
        Object.assign(assetsContent.librarys, preAssetsContent.librarys);

        let data = JSON.stringify(assetsContent, null, 2);
        return fsp.writeFile(assetsPath, data, 'utf8').then(() => assetsContent);
    })
}