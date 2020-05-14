const path = require('path');

'use strict';
module.exports = {
    mode: 'development',
    entry: {
        'ui/bundle': ['babel-polyfill', './src/app.js'],
        'hub/bundle': ['babel-polyfill', './src/hub.js'],
    },
    output: {
        path: path.resolve(__dirname, '/build'),
        filename: '[name].js'
    },
    devServer: {
        inline: true,
        contentBase: './build',
        port: 8083,
        compress: true,
        disableHostCheck: true,
        watchOptions: {
            ignored: [
                path.resolve(__dirname, 'build'),
                path.resolve(__dirname, 'node_modules')
            ]
        }
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
        }],
    },
    resolve: {
        extensions: ['.js']
    }
}