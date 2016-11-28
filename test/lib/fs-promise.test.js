const path = require('path');
const assert = require('assert');
const fsPromise = require('../../lib/fs-promise');

describe('#fs-promise', () => {
    const dist = path.join(__dirname, 'dist', 'test', 'test.json');
    const json = { type: 'test' };

    it('write file && read file', () => {
        return fsPromise.writeFile(dist, JSON.stringify(json), 'utf-8').then(() => {
            return fsPromise.readFile(dist, 'utf-8')
                .then(json => JSON.parse(json))
                .then(data => {
                    assert.deepEqual(json, data);
                });
        });
    });

});
