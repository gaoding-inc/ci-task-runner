// 这里字符串可能用来传递环境变量，所以不能是 Symbol 类型
module.exports = Object.freeze({
    WEBPACK_PATH: 'WEBPACK_PATH',
    WEBPACK_CONFIG_PATH: 'WEBPACK_CONFIG_PATH',
    WEBPACK_CONTEXT: 'WEBPACK_CONTEXT',
    WEBPACK_RESULT: 'WEBPACK_RESULT'
});