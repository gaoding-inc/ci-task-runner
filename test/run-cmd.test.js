const assert = require('assert');
const runCmd = require('../src/run-cmd');

describe('#runCmd', () => {
    it('exec script', () => {
        return runCmd('echo "hello"');
    });

    // it('childProcess.exec error', () => {
    //     return runCmd("", {
    //         cwd: {}
    //     }).then(() => {
    //         throw new Error('error');
    //     }, errors => {
    //         assert.equal('object', typeof errors);
    //     });
    // });

    it('exec error', () => {
        return runCmd(`@error%`, {
            timeout: 100
        }).then(() => {
            throw new Error('error');
        }, errors => {
            assert.equal('object', typeof errors);
        });
    });

    it('options.timeout', () => {
        return runCmd(`node -e "setTimeout(()=> {}, 3000)"`, {
            timeout: 100
        }).then(() => {
            throw new Error('options.timeout: error');
        }, errors => {
            assert.equal(true, errors.message.indexOf(`timeout`) !== -1);
        });
    });
});