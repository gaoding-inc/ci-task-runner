const assert = require('assert');
const template = require('../src/template');

describe('#template', () => {
    it('set variables', () => {
        let variables = {
            value: '饼'
        };
        assert.deepEqual(`hello ${variables.value}`, template('hello ${value}', variables));
        assert.deepEqual(`hello ${variables.udf}`, template('hello ${udf}', variables));
    });
});
