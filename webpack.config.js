const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: './web/js/main.js',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './web/build',
    port: 3020
  },
  output: {
    filename: 'wv.js',
    chunkFilename: 'wv-chunk.js',
    path: path.join(__dirname, '/web/build')
  },
  plugins: [
    new CleanWebpackPlugin(['web/build']),
    new CopyWebpackPlugin([
      { from: 'web/images', to: 'images' },
      { from: 'web/fonts', to: 'fonts' },
      { from: 'web/brand', to: 'brand' },
      { from: 'web/pages', to: 'pages' }
    ]),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Worldview',
      template: 'web/index.html',
      filename: './index.html',
      inject: false
    }),
    new webpack.ProvidePlugin({
      '$': 'jquery',
      'jQuery': 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery'
    }),
    new MiniCssExtractPlugin({
      filename: 'wv.css'
    }),
    new WriteFilePlugin()
  ],
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [{
          loader: MiniCssExtractPlugin.loader
        },
        {
          loader: 'css-loader', // translates CSS into CommonJS modules
          options: {
            url: false
          }
        },
        {
          loader: 'postcss-loader', // Run post css actions
          options: {
            plugins: function () { // post css plugins
              return [
                require('postcss-import'),
                require('precss'),
                require('autoprefixer')
              ];
            }
          }
        },
        {
          loader: 'resolve-url-loader'
        },
        {
          loader: 'sass-loader' // compiles Sass to CSS
        }]
      },
      {
        test: /\.(js|jsx)$/,
        use: ['babel-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'images/'
          }
        }
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: {
          // handle font-awesome fonts
          loader: 'url-loader?limit=10000&mimetype=application/font-woff',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }
      },
      {
        test: /\.html$/,
        use: [ {
          loader: 'html-loader',
          options: {
            minimize: !devMode,
            removeComments: !devMode,
            removeEmptyAttributes: !devMode,
            sortAttributes: !devMode,
            sortClassName: !devMode
          }
        }]
      }
    ]
  }
};
