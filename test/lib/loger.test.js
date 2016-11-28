const assert = require('assert');
const Loger = require('../../lib/loger');

describe('#loger', () => {
    it('toUBB', () => {
        let loger = new Loger(false);
        assert.deepEqual('[id]hello world!', loger.toUBB('[red][id]hello world![/red]'));
        assert.deepEqual('[id]hello world!', loger.toUBB('[id]hello world!'));
    });
    it('display color', () => {
        let loger = new Loger(true);
        loger.log('hello [green]world[/green]!');
        loger.error('hello [red]world[/red]!');
    });
});