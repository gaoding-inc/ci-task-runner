const path = require('path');
const assert = require('assert');
const worker = require('../../lib/worker');

describe('#worker', () => {

    it('childProcess exec', () => {
        let target = path.join(__dirname, '..', '..', 'package.json');
        let data = require(target);
        return worker(`node worker-child.js`, {
            cwd: path.join(__dirname, '..', 'file', 'script')
        }).then(packageData => {
            assert.deepEqual(data.name, packageData.name);
        });
    });

});