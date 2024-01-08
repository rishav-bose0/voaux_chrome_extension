// const path = require('path');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// // const {CleanWebpackPlugin} = require('clean-webpack-plugin');
// const CopyPlugin = require('copy-webpack-plugin');
//
// module.exports = {
//     entry: {
//         popup: './src/main_c.js',
//         serviceWorker: './src/background.js',
//     },
//     output: {
//         path: path.resolve(__dirname, './dist/'), // Output directory
//         filename: '[name].bundle.js', // Bundled JavaScript file
//         // publicPath: '/dist/', // Public path for assets
//     },
//     plugins: [
//         new CopyPlugin({
//             patterns: [
//                 { from: 'static'},
//             ],
//         }),
//         // new CleanWebpackPlugin(), // Clean output directory
//         new MiniCssExtractPlugin({ // Extract CSS into separate file
//             filename: 'styles.css', // Bundled JavaScript file
//         }),
//     ],
//     resolve: {
//         extensions: ['.js'], // Resolving file extensions
//     },
//     module: {
//         rules: [
//             {
//                 test: /\.js$/,
//                 exclude: /node_modules/,
//                 use: "babel-loader"
//             },
//             // CSS handling
//             {
//                 test: /\.css$/,
//                 use: [
//                     'style-loader',
//                     // MiniCssExtractPlugin.loader,
//                     'css-loader',
//                     'postcss-loader',
//                 ],
//             },
//             // SVG handling
//             {
//                 test: /\.svg$/,
//                 use: {
//                     loader: 'file-loader', // Use file-loader for SVG files
//                     options: {
//                         name: '[name].[ext]', // Keep the original file name and extension
//                         outputPath: 'assets/', // Output directory for bundled SVG files
//                     },
//                 },
//             },
//             // PNG handling
//             {
//                 test: /\.png$/,
//                 use: {
//                     loader: 'file-loader', // Use file-loader for SVG files
//                     options: {
//                         name: '[name].[ext]', // Keep the original file name and extension
//                         outputPath: 'assets/', // Output directory for bundled SVG files
//                     },
//                 },
//             },
//         ],
//     },
// };

require('dotenv').config();
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        background: './src/background.js',
        content: './src/main_c.js',
        popup: './src/popup.js',
        offscreen: './src/offscreen.js'
        // Add other entry points for different parts of your extension
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'static'},
            ],
        }),
        new webpack.DefinePlugin({
            'process.env.API_URL_TTS': JSON.stringify(process.env.API_URL_TTS),
            'process.env.API_URL_SPEAKER_DETAILS': JSON.stringify(process.env.API_URL_SPEAKER_DETAILS),
        }),
        // // new CleanWebpackPlugin(), // Clean output directory
        // new MiniCssExtractPlugin({ // Extract CSS into separate file
        //     filename: 'styles.css', // Bundled JavaScript file
        // }),
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.ico$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'icons/', // Output directory for ICO files
                        },
                    },
                ],
            }
            // {
            //     test: /\.svg$/,
            //     type: 'asset/resource',
            // },
            // {
            //     test: /\.png$/,
            //     type: 'asset/resource',
            // },
            // Add rules for other file types (e.g., CSS, JSON, etc.) as needed
        ],
    },
};
