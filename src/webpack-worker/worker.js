'use strict';

const childProcess = require('child_process');
const TYPE = require('./type');

process.on('error', errors => {
    console.error(errors);
    process.exit(1);
});

const WEBPACK_CONFIG = process.env.WEBPACK_CONFIG;
const WEBPACK_CONTEXT = process.env.WEBPACK_CONTEXT;
const CMD = `node --print "require.resolve('webpack')"`;
const webpackPath = childProcess.execSync(CMD, { cwd: WEBPACK_CONTEXT }).toString().trim();


const webpack = require(webpackPath);
const options = require(WEBPACK_CONFIG);


Object.assign(options, { context: WEBPACK_CONTEXT });
let webpackCliConfig = options.entry && options.output;
let compiler = webpackCliConfig ? webpack(options) : options;


compiler.run(function (errors, stats) {
    if (errors) {
        process.send({
            cmd: TYPE.WEBPACK_RESULT,
            errors: errors.toString(),
            data: null
        });
        process.exit(1);
    } else {
        process.send({
            cmd: TYPE.WEBPACK_RESULT,
            errors: null,
            data: Object.assign(stats.toJson(), {
                compilation: {
                    outputOptions: stats.compilation.outputOptions
                }
            })
        });
        process.exit(0);
    }
});
