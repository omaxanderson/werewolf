//const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const entries = (ext) => {
    let entries = {};

    glob.sync(`./src/components/*.${ext}`).map(f => `./${f}`).forEach(f => {
        const regex = ext === 'tsx' ? /\/([^\/]+)\.tsx$/ : /\/([^\/]+)\.scss$/;
        const m = f.match(regex);
        entries[m[1]] = ['@babel/polyfill', f];
    });

    return entries;
};

const jsConfig = {
    devtool: 'source-map',
    mode: 'development',
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss'],
    },
    entry: entries('tsx'),
    output: {
        path: path.resolve(__dirname, 'src/public/js'),
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
            {
                test: /\.scss$/,
                loader: [
                    // MiniCssExtractPlugin.loader,
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            esModule: true,
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ]
            }
        ],
    },
};

const cssConfig = {
    devtool: 'source-map',
    mode: 'development',
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss'],
    },
    entry: entries('scss'),
    output: {
        path: path.resolve(__dirname, 'src/public/css'),
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                loader: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ]
            }
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
    ],
};

module.exports = [jsConfig, cssConfig];
