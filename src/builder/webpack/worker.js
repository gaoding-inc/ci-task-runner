'use strict';

const TYPE = require('./type');
process.on('error', errors => {
    console.error(errors);
    process.exit(1);
});

const WEBPACK_PATH = process.env[TYPE.WEBPACK_PATH];
const WEBPACK_CONFIG_PATH = process.env[TYPE.WEBPACK_CONFIG_PATH];
const WEBPACK_CONTEXT = process.env[TYPE.WEBPACK_CONTEXT];


const webpack = require(WEBPACK_PATH);
const options = require(WEBPACK_CONFIG_PATH);


Object.assign(options, { context: WEBPACK_CONTEXT });
let isWebpackCliConfig = options.entry && options.output && typeof options.run !== 'function';
let compiler = isWebpackCliConfig ? webpack(options) : options;


compiler.run(function (errors, stats) {
    if (errors) {
        process.send({
            cmd: TYPE.WEBPACK_RESULT,
            errors: errors.toString(),
            data: null
        });
    } else {

        if (isWebpackCliConfig) {
            console.log('[webpack:build]', stats.toString({
                chunks: false,
                colors: true
            }));
        }

        process.send({
            cmd: TYPE.WEBPACK_RESULT,
            errors: null,
            data: Object.assign(stats.toJson(), {
                compilation: {
                    outputOptions: stats.compilation.outputOptions
                }
            })
        });
    }
});
