const EventEmitter = require('events');
const StringDecoder = require('string_decoder').StringDecoder;
const SPLIT = '------WORKER_MESSAGE';

class Parser extends EventEmitter {
    constructor() {
        super();
        this.decoder = new StringDecoder('utf8');
        this.jsonBuffer = '';
    }

    encode(message) {
        return JSON.stringify(message) + SPLIT;
    }

    data(buf) {
        let jsonBuffer = this.jsonBuffer;
        jsonBuffer += this.decoder.write(buf);
        let i, start = 0;
        while ((i = jsonBuffer.indexOf(SPLIT, start)) >= 0) {
            const json = jsonBuffer.slice(start, i);
            const message = JSON.parse(json);
            this.emit('message', message);
            start = i + 1;
        }
        this.jsonBuffer = jsonBuffer.slice(start);
    }
}

module.exports = Parser;