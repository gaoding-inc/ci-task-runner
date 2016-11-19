const path = require('path');
const gulp = require('gulp');
const rename = require('gulp-rename');
const fsp = require('fs-promise');
const defaultsDeep = require('lodash.defaultsdeep');
const ASSETS_DEFAULT_NAME = './config/assets.default.json';
const ASSETS_DEFAULT_PATH = path.join(__dirname, ASSETS_DEFAULT_NAME);
const ASSETS_DEFAULT = require(ASSETS_DEFAULT_NAME);


/**
 * 读取上一次的编译记录
 * @param   {string}     assetsPath     路径
 * @return  {Promise}
 */
module.exports = assetsPath => {
    return fsp.readFile(assetsPath, 'utf8').then(JSON.parse).catch(() => {
        return new Promise((resolve, reject) => {
            let basename = path.basename(assetsPath);

            // 使用 gulp 创建文件可避免目录不存在的问题
            gulp.src(ASSETS_DEFAULT_PATH)
                .pipe(rename(basename))
                .pipe(gulp.dest(path.dirname(assetsPath)))
                .on('end', errors => {
                    if (errors) {
                        reject(errors);
                    } else {
                        let assetsContent = defaultsDeep({}, ASSETS_DEFAULT);
                        resolve(assetsContent);
                    }
                });
        });
    });
};