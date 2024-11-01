'use strict';

var path = require('path');
var webpack = require('webpack');
var HardSourcePlugin = require('hard-source-webpack-plugin');

module.exports = {
  context: __dirname,
  entry: {
    duckhunt: './main.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader?cacheDirectory',
        options: { presets: ['es2015'] },
      },
      {
        test: /\.png$/,
        loader: 'file-loader',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.(mp3|ogg)$/,
        loader: 'file-loader',
      }
    ]
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.min.js'],
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    inline: true,
    port: 8080
  },
  stats: {
    all: true,           // This will output detailed build information
    warnings: true,      // Include warnings
    errors: true,        // Include errors
    timings: true,       // Show timings
    modules: true,       // Display module information
    colors: true         // Use colors for easier readability in the terminal
  },
  plugins: [
    new HardSourcePlugin({
      cacheDirectory: path.join(__dirname, 'node_modules/.cache/hardsource/[confighash]'),
      recordsPath: path.join(__dirname, 'node_modules/.cache/hardsource/[confighash]/records.json'),
      configHash: function(webpackConfig) {
        return require('node-object-hash')().hash(webpackConfig);
      }
    })
  ],
};