
class StringStyle {
    constructor(string) {
        this.string = [...string];
    }

    toString() {
        return this.string.join('');
    }

    color(value) {
        if (StringStyle.colors[value]) {
            let style = StringStyle.colors[value];
            this.string.unshift(style[0]);
            this.string.push(style[1]);
        }

        return this;
    }

    fontWeight(value) {
        if (value === 'bold') {
            let style = ['\x1B[1m', '\x1B[22m'];
            this.string.unshift(style[0]);
            this.string.push(style[1]);
        }

        return this;
    }

    fontStyle(value) {
        if (value === 'italic') {
            let style = ['\x1B[3m', '\x1B[23m'];
            this.string.unshift(style[0]);
            this.string.push(style[1]);
        }
    }

    textDecoration(value) {
        if (value === 'underline') {
            let style = ['\x1B[4m', '\x1B[24m'];
            this.string.unshift(style[0]);
            this.string.push(style[1])
        }
    }

    minWidth(length) {
        this.string.push(...' '.repeat(Math.max(0, length - this.string.length)));
        return this;
    }

    maxWidth(length) {
        this.string.length = Math.min(this.string.length, length);
        return this;
    }

    width(length) {
        this.string.push(...' '.repeat(length));
        this.string.length = length;
        return this;
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

        return this;
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
     * @param   {boolean}   displayStyle    是否显示彩色日志
     */
    constructor(styles = [], displayStyle = process.stdout.isTTY || process.env.LOGER_DISPLAY_COLOR) {
        this.styles = styles;
        this.displayStyle = displayStyle;
        this.log = this.log.bind(this);
        this.error = this.error.bind(this);
    }

    log(...messages) {
        console.log(...this.setStyles(messages));
    }

    error(...messages) {
        console.error(...this.setStyles(messages));
    }

    setStyles(messages) {
        if (this.displayStyle) {
            return messages.map((message, index) => {
                let stringStyle = new StringStyle(message);
                let style = this.styles[index];
                
                Object.keys(style || {}).forEach(name => {
                    stringStyle[name](style[name]);
                });

                return stringStyle.toString();
            });
        } else {
            return messages;
        }
    }
};

module.exports = Loger;