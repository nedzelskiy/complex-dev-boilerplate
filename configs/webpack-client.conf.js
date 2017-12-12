'use strict';

const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    CLIENT__SRC_FOLDER:             process.env.CLIENT__SRC_FOLDER,
    CLIENT__BUILD_FOLDER:           process.env.CLIENT__BUILD_FOLDER,
    CONFIGS_SERVICES__DIR:          process.env.CONFIGS_SERVICES__DIR
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.log(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
    }
}

const fs = require('fs');
const webpack = require('webpack');
const WebpackShellPlugin = require('webpack-shell-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CssoWebpackPlugin = require('csso-webpack-plugin').default;
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin');

console.log(`${FILENAME}: webpack config running! PID:[${process.pid}]`);

let config = {
    entry: {
      "client-bundle" : path.normalize(`${ process.env.PWD}/${CONSTANTS.CLIENT__SRC_FOLDER}/client.tsx`)
    },
    output: {
        path: path.normalize(`${ process.env.PWD}/${CONSTANTS.CLIENT__BUILD_FOLDER}`),
        filename: '[name].min.js',
        library: 'App'
    },
    watch: true,
    watchOptions: {
        aggregateTimeout: 20
    },
    resolve: {
        alias: {
            'react': 'preact-compat',
            'react-dom': 'preact-compat'
        },
        extensions: [".tsx", ".ts", ".js"],
        modules: [
            "node_modules",
            path.normalize(`${ process.env.PWD}/${CONSTANTS.CLIENT__SRC_FOLDER}/containers/`),
            path.normalize(`${ process.env.PWD}/${CONSTANTS.CLIENT__SRC_FOLDER}/components/`),
            path.normalize(`${ process.env.PWD}/${CONSTANTS.CLIENT__SRC_FOLDER}/`)
        ],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: `${ process.env.PWD}/${CONSTANTS.CONFIGS_SERVICES__DIR}/tsconfig-client.json`
                    }
                },
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: ['css-loader', 'sass-loader']
                })
            }
        ]
    },
    plugins: [
        new webpack.optimize.ModuleConcatenationPlugin(),
        new ExtractTextPlugin({
            filename: "[name].css"
        }),
        new WebpackShellPlugin({
            onBuildExit: ['node ./scripts/build-client-script.js']
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                keep_fnames: true
            },
            mangle: {
                keep_fnames: true
            },
            comments: false,
            sourceMap: true,
            minimize: true
        }),
        new UnminifiedWebpackPlugin({
            exclude: /\.css$/
        }),
        new CssoWebpackPlugin({ pluginOutputPostfix: 'min' }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.AggressiveMergingPlugin()
    ],
    devtool: 'source-map'
};

module.exports = config;