'use strict';
const fs = require('fs');
const net = require('net');
const EventEmitter = require('events');
const Client = require('./client');
const sockPath = require('./sock-path');

class Server extends EventEmitter {
    constructor(name) {
        super();
        this.clients = [];
        this.sockPath = sockPath(name);
        this.server = net.createServer((socket) => this._handleConnection(name, socket));
    }

    listen(callback) {
        let sockPath = this.sockPath;
        fs.access(sockPath, errors => {
            if (errors) {
                this.server.listen(sockPath, callback);
            } else {
                fs.unlink(sockPath, errors => {
                    if (errors) {
                        callback(errors);
                    } else {
                        this.server.listen(sockPath, callback);
                    }
                });
            }
        });
    }

    close(callback) {
        this.clients.forEach(socket => {
            socket.destroy();
        });
        this.server.close(() => {
            this.server.unref();
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    _handleConnection(name, socket) {
        const client = new Client(name, socket);
        client.on('message', message => {
            this._handleRequest(message, client);
        });
        this.emit('connect', client);
        this.clients.push(socket);
        
        socket.on('close', () => {
            this.clients.splice(this.clients.indexOf(socket), 1);
        });
    }

    _handleRequest(message, client) {
        this.emit('message', message, client);
    }
}

module.exports = Server;