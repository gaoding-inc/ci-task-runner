const assert = require('assert');
const worker = require('../../lib/run-cmd');

describe('#worker', () => {
    it('exec script', () => {
        return worker('echo "hello"');
    });

    // it('childProcess.exec error', () => {
    //     return worker("", {
    //         cwd: {}
    //     }).then(() => {
    //         throw new Error('error');
    //     }, errors => {
    //         assert.equal('object', typeof errors);
    //     });
    // });

    it('exec error', () => {
        return worker(`@error%`, {
            timeout: 100
        }).then(() => {
            throw new Error('error');
        }, errors => {
            assert.equal('object', typeof errors);
        });
    });

    it('options.timeout', () => {
        return worker(`node -e "setTimeout(()=> {}, 3000)"`, {
            timeout: 100
        }).then(() => {
            throw new Error('options.timeout: error');
        }, errors => {
            assert.equal(true, errors.message.indexOf(`timeout`) !== -1);
        });
    });
});