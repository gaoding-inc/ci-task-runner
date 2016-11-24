const fsp = require('../lib/fs-promise');
const defaultsDeep = require('lodash.defaultsdeep');
const ASSETS_DEFAULT_NAME = './config/assets.default.json';
const ASSETS_DEFAULT = require(ASSETS_DEFAULT_NAME);


/**
 * 读取上一次的编译记录
 * @param   {string}     assetsPath     路径
 * @return  {Promise}
 */
module.exports = assetsPath => {
    return fsp.readFile(assetsPath, 'utf8').catch(() => {
        let json = JSON.stringify(ASSETS_DEFAULT, null, 2);
        return fsp.writeFile(assetsPath, json, 'utf8')
    }).then(JSON.parse).then(data => defaultsDeep(data, ASSETS_DEFAULT));
};