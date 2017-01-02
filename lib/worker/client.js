const net = require('net');
const EventEmitter = require('events');
const Parser = require('./parser');
const sockPath = require('./sock-path');

class Client extends EventEmitter {
    constructor(name, socket) {
        super();
        this.sockPath = sockPath(name);
        this.socket = socket || net.connect(this.sockPath);
        this.bind();
    }

    bind() {
        const parser = new Parser();
        const socket = this.socket;
        
        socket.on('data', (buf) => {
            parser.data(buf);
        });

        parser.on('message', (message) => {
            this.emit('message', message);
        });

        this.parser = parser;
    }

    send(message, callback) {
        this.socket.write(this.parser.encode(message), callback);
    }

    close() {
        if (this.socket) {
            this.socket.destroy();
        }
    }
}

module.exports = Client;