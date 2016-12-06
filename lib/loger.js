
class StringStyle {
    constructor(string, displayColor = true) {
        this.string = [...string];
        this.displayColor = displayColor;
    }

    toString() {
        return this.string.join('');
    }

    minWidth(length) {
        this.string.push(...' '.repeat(Math.max(0, length - this.string.length)));
    }

    maxWidth(length) {
        this.string.length = Math.min(this.string.length, length);
    }

    width(length) {
        this.string.push(...' '.repeat(length));
        this.string.length = length;
    }

    textAlign(value) {
        let content = this.toString();
        let str, length;
        switch (value) {
            case 'left':
                str = content.trimLeft();
                str = str + ' '.repeat([...content].length - [...str].length);
                this.string = [...str];
                break;
            case 'right':
                str = content.trimRight();
                str = ' '.repeat([...content].length - [...str].length) + str;
                this.string = [...str];
                break;
            case 'center':
                str = content.trim();
                length = ([...content].length - [...str].length) / 2;
                str = ' '.repeat(Math.trunc(length)) + str + ' '.repeat(Math.ceil(length));
                this.string = [...str];
                break;
        }
    }

    color(value) {
        if (this.displayColor && StringStyle.colors[value]) {
            let style = StringStyle.colors[value];
            this.string.unshift(style[0]);
            this.string.push(style[1]);
        }
    }

    fontWeight(value) {
        if (this.displayColor && value === 'bold') {
            let style = ['\x1B[1m', '\x1B[22m'];
            this.string.unshift(style[0]);
            this.string.push(style[1]);
        }
    }

    fontStyle(value) {
        if (this.displayColor && value === 'italic') {
            let style = ['\x1B[3m', '\x1B[23m'];
            this.string.unshift(style[0]);
            this.string.push(style[1]);
        }
    }

    textDecoration(value) {
        if (this.displayColor && value === 'underline') {
            let style = ['\x1B[4m', '\x1B[24m'];
            this.string.unshift(style[0]);
            this.string.push(style[1])
        }
    }

};

StringStyle.colors = {
    white: ['\x1B[37m', '\x1B[39m'],
    gray: ['\x1B[90m', '\x1B[39m'],
    black: ['\x1B[30m', '\x1B[39m'],
    blue: ['\x1B[34m', '\x1B[39m'],
    cyan: ['\x1B[36m', '\x1B[39m'],
    green: ['\x1B[32m', '\x1B[39m'],
    magenta: ['\x1B[35m', '\x1B[39m'],
    red: ['\x1B[31m', '\x1B[39m'],
    yellow: ['\x1B[33m', '\x1B[39m'],
    inverse: ['\x1B[7m', '\x1B[27m'] // 特有的反白颜色
};



class Loger {

    /**
     * 支持设置样式的日志显示程序
     * @param   {Object[]}  styles          样式配置
     * @param   {boolean}   displayColor    是否显示彩色日志
     */
    constructor(styles = [], displayColor = process.stdout.isTTY || process.env.LOGER_DISPLAY_COLOR) {
        this.styles = styles;
        this.displayColor = displayColor;
        this.log = this.log.bind(this);
        this.error = this.error.bind(this);
    }

    log(...messages) {
        console.log(...this.setStyles(messages));
    }

    error(...messages) {
        console.error(...this.setStyles(messages));
    }

    // TODO style 声明顺序问题
    setStyles(messages) {
        return messages.map((message, index) => {
            let stringStyle = new StringStyle(message, this.displayColor);
            let style = this.styles[index];

            Object.keys(style || {}).forEach(name => {
                stringStyle[name](style[name]);
            });

            return stringStyle.toString();
        });
    }
};

module.exports = Loger;