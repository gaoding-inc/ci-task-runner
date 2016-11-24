'use strict';

const TYPE = require('./type');
process.on('error', errors => {
    console.error(errors);
    process.exit(1);
});

const WEBPACK_PATH = process.env[TYPE.WEBPACK_PATH];
const WEBPACK_CONFIG_PATH = process.env[TYPE.WEBPACK_CONFIG_PATH];

const webpack = require(WEBPACK_PATH);
const options = require(WEBPACK_CONFIG_PATH);


let isWebpackCliConfig = options.entry && options.output && typeof options.run !== 'function';
let compiler = isWebpackCliConfig ? webpack(options) : options;


compiler.run(function (errors, stats) {
    if (errors) {
        process.send({
            cmd: TYPE.WEBPACK_RESULT,
            errors: errors.toString(),
            data: null
        }, () => {
            process.exit(1);
        });
    } else {

        process.send({
            cmd: TYPE.WEBPACK_RESULT,
            errors: null,
            data: {
                // 不直接使用 console.log 是为了避免顺序问题
                log: stats.toString({
                    chunks: false,
                    colors: true
                }),
                data: Object.assign(stats.toJson(), {
                    compilation: {
                        outputOptions: stats.compilation.outputOptions
                    }
                })
            }
        }, () => {
            if (isWebpackCliConfig) {
                process.exit(0);
            }
        });
    }
});
