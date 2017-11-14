'use strict';
const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    CLIENT__SRC_FOLDER:             process.env.CLIENT__SRC_FOLDER,
    CLIENT__BUILD_FOLDER:           process.env.CLIENT__BUILD_FOLDER
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.error(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
        return false;
    }
}

const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const WebpackShellPlugin = require('webpack-shell-plugin');

console.log(`${FILENAME}: webpack config running! PID:[${process.pid}]`);

module.exports = {
    entry: path.normalize(__dirname + `/../${CONSTANTS.CLIENT__SRC_FOLDER}/client.tsx`),
    output: {
        path: path.normalize(__dirname + `/../${CONSTANTS.CLIENT__BUILD_FOLDER}`),
        filename: 'client-bundle.js',
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
            path.normalize(__dirname + `/../${CONSTANTS.CLIENT__SRC_FOLDER}/containers/`),
            path.normalize(__dirname + `/../${CONSTANTS.CLIENT__SRC_FOLDER}/components/`),
            path.normalize(__dirname + `/../${CONSTANTS.CLIENT__SRC_FOLDER}/`)
        ],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: "../../configs/tsconfig-client.json"
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
        new ExtractTextPlugin({
            filename: "client-bundle.css"
        }),
        new WebpackShellPlugin({
            onBuildExit:['node ./scripts/build-client-script.js']
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: { warnings: false },
        //     comments: false,
        //     sourceMap: true,
        //     minimize: false
        // }),
        new webpack.optimize.AggressiveMergingPlugin()//Merge chunks
    ],
    devtool: 'source-map'
};