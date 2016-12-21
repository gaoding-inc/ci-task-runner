const fs = require('fs');
const path = require('path');
const promiseify = require('../../lib/promiseify');
const access = promiseify(fs.access);

describe('#merge', () => {
    it('promise', () => {
        return access(path.join(__dirname, '..', '..', 'package.json'));
    });
});
