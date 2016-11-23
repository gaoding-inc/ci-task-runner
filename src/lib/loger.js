const color = require('cli-color');

const UBB_REG = /(?:\[(.*?)\])(.*?)(?:\[\/\1\])/g;

class Loger {

    constructor(displayColor = process.stdout.isTTY || process.env.LOGER_DISPLAY_COLOR) {
        this.displayColor = displayColor;
        this.log = this.log.bind(this);
        this.error = this.error.bind(this);
        this.toUBB = this.toUBB.bind(this);
    }

    log(...messages) {
        console.log(...messages.map(this.toUBB));
    }

    error(...messages) {
        console.error(...messages.map(this.toUBB));
    }

    toUBB(content) {
        return content.replace(UBB_REG, ($0, tag, value) => {
            return this.displayColor ? color[tag](value) : value;
        });
    }
};

module.exports = Loger;