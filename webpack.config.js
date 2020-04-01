//const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');
const glob = require('glob');

const entries = () => {
    let entries = {};

    glob.sync('./src/components/*.tsx').map(f => `./${f}`).forEach(f => {
        const m = f.match(/\/([^\/]+)\.tsx$/);
        entries[m[1]] = ['@babel/polyfill', f];
    });

    return entries;
};

module.exports = {
    devtool: 'source-map',
    mode: 'development',
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    entry: entries(),
    output: {
        path: path.resolve(__dirname, 'public'),
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader"
                },
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader'
            },
            {
                test: /\.pug$/,
                use: ['pug-loader'],
            },
            /*
            {
                test: /\.html$/,
                use: [
                    {
                        loader: "html-loader"
                    },
                ],
            },
             */
        ],
    },
    /*
    plugins: [
        new HtmlWebPackPlugin({
            template: "./src/components/index.html",
            filename: "./index.html"
        }),
    ],
     */
};
