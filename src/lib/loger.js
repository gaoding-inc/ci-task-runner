const UBB_REG = /(?:\[(.*?)\])(.*?)(?:\[\/\1\])/g;
const styles = {
    // styles
    'bold'      : ['\x1B[1m',  '\x1B[22m'],
    'italic'    : ['\x1B[3m',  '\x1B[23m'],
    'underline' : ['\x1B[4m',  '\x1B[24m'],
    'inverse'   : ['\x1B[7m',  '\x1B[27m'],
    // colors
    'white'     : ['\x1B[37m', '\x1B[39m'],
    'gray'      : ['\x1B[90m', '\x1B[39m'],
    'black'     : ['\x1B[30m', '\x1B[39m'],
    'blue'      : ['\x1B[34m', '\x1B[39m'],
    'cyan'      : ['\x1B[36m', '\x1B[39m'],
    'green'     : ['\x1B[32m', '\x1B[39m'],
    'magenta'   : ['\x1B[35m', '\x1B[39m'],
    'red'       : ['\x1B[31m', '\x1B[39m'],
    'yellow'    : ['\x1B[33m', '\x1B[39m']
};


styles['b'] = styles['bold'];
styles['i'] = styles['italic'];
styles['u'] = styles['underline'];


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

    color(tag, value) {
        return styles[tag][0] + value + styles[tag][1];
    }

    toUBB(content) {
        return content.replace(UBB_REG, ($0, tag, value) => {
            return this.displayColor ? this.color(tag, value) : value;
        });
    }
};

module.exports = Loger;