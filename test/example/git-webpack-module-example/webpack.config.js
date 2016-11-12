var path = require('path');
module.exports = {
    context: __dirname,
    entry: {
        'index': './js/index.js'
    },
    output: {
        path: path.join(__dirname, '../dist/git-webpack-module-example'),
        filename: '[name].js'
    },
    devtool: 'source-map',
    module: {
        loaders: [
            // {
            //     test: /\.css$/,
            //     loader: 'style!css'
            // }
        ]
    },
    plugins: [function () {
        this.plugin('done', function (stats) {
            // console.log('done');
        });
    }]
};