/**
 * 字符串模板替换
 * @param   {string}      string     模板
 * @param   {Object}      data       数据
 * @return  {string}
 */
module.exports = (string, data) => string.replace(/\$\{([^\}]*?)\}/g, ($0, key) => String(data[key]));