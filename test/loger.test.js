const assert = require('assert');
const Loger = require('../src/loger');


describe('#loger', () => {

    it('loger.log', () => {
        let loger = new Loger();
        loger.log('loger.log', '😐');
    });

    it('loger.error', () => {
        let loger = new Loger();
        loger.log('loger.error', '😐');
    });

    it('minWidth', () => {
        let loger = new Loger([{
            minWidth: 10
        }]);
        assert.deepEqual([
            'hello😐𠮷   '
        ], loger.setStyles(['hello😐𠮷']));
        assert.deepEqual([
            'hello😐𠮷hello😐𠮷hello😐𠮷'
        ], loger.setStyles(['hello😐𠮷hello😐𠮷hello😐𠮷']));
    });

    it('maxWidth', () => {
        let loger = new Loger([{
            maxWidth: 10
        }]);
        assert.deepEqual([
            'hello😐𠮷'
        ], loger.setStyles(['hello😐𠮷']));
        assert.deepEqual([
            'hello😐𠮷hel'
        ], loger.setStyles(['hello😐𠮷hello😐𠮷hello😐𠮷']));
    });

    it('width', () => {
        let loger = new Loger([{
            width: 10
        }]);
        assert.deepEqual([
            'hello😐𠮷   '
        ], loger.setStyles(['hello😐𠮷']));
        assert.deepEqual([
            'hello😐𠮷hel'
        ], loger.setStyles(['hello😐𠮷hello😐𠮷hello😐𠮷']));
    });

    it('textAlign: left', () => {
        let loger = new Loger([{
            minWidth: 10,
            textAlign: 'left'
        }]);
        assert.deepEqual([
            'hello😐𠮷   '
        ], loger.setStyles(['hello😐𠮷']));
        assert.deepEqual([
            'hello😐𠮷hello😐𠮷hello😐𠮷'
        ], loger.setStyles(['hello😐𠮷hello😐𠮷hello😐𠮷']));
    });

    it('textAlign: center', () => {
        let loger = new Loger([{
            minWidth: 10,
            textAlign: 'center'
        }]);
        assert.deepEqual([
            ' hello😐𠮷  '
        ], loger.setStyles(['hello😐𠮷']));
        assert.deepEqual([
            'hello😐𠮷hello😐𠮷hello😐𠮷'
        ], loger.setStyles(['hello😐𠮷hello😐𠮷hello😐𠮷']));
    });

    it('textAlign: right', () => {
        let loger = new Loger([{
            minWidth: 10,
            textAlign: 'right'
        }]);
        assert.deepEqual([
            '   hello😐𠮷'
        ], loger.setStyles(['hello😐𠮷']));
        assert.deepEqual([
            'hello😐𠮷hello😐𠮷hello😐𠮷'
        ], loger.setStyles(['hello😐𠮷hello😐𠮷hello😐𠮷']));
    });

    it('color:white', () => {
        let loger = new Loger([{
            color: 'white'
        }]);
        assert.deepEqual([
            '\x1B[37m' + 'hello😐𠮷' + '\x1B[39m'
        ], loger.setStyles(['hello😐𠮷']));
    });

    it('fontWeight:bold', () => {
        let loger = new Loger([{
            fontWeight: 'bold'
        }]);
        assert.deepEqual([
            '\x1B[1m' + 'hello😐𠮷' + '\x1B[22m'
        ], loger.setStyles(['hello😐𠮷']));
    });

    it('fontStyle:italic', () => {
        let loger = new Loger([{
            fontStyle: 'italic'
        }]);
        assert.deepEqual([
            '\x1B[3m' + 'hello😐𠮷' + '\x1B[23m'
        ], loger.setStyles(['hello😐𠮷']));
    });

    it('textDecoration:underline', () => {
        let loger = new Loger([{
            textDecoration: 'underline'
        }]);
        assert.deepEqual([
            '\x1B[4m' + 'hello😐𠮷' + '\x1B[24m'
        ], loger.setStyles(['hello😐𠮷']));
    });

    it('all', () => {
        let loger = new Loger([{
            minWidth: 20,
            textAlign: 'center',
            textDecoration: 'underline',
            color: 'green',
            fontStyle: 'italic',
            fontWeight: 'bold'
        }]);
        loger.log('😐hello world😐');
    });

});