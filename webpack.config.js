const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const cssnano = require('cssnano');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const devMode = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'testing';

const pluginSystem = [
  new CleanWebpackPlugin(['web/build']),
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
];

/* Conditional Plugin Management */
// add hot module replacement
if (process.env.NODE_ENV === 'development') {
  pluginSystem.push(
    new webpack.HotModuleReplacementPlugin(), // use path to module for development performance
    new webpack.NamedModulesPlugin()
  );
};

// add bundle analzyer
if (process.env.NODE_ENV === 'analyze') {
  pluginSystem.push(new BundleAnalyzerPlugin());
};

// handle testing entry point and output file name
let entryPoint = './web/js/main.js';
let outputFileName = 'wv.js';
if (process.env.NODE_ENV === 'testing') {
  entryPoint = './test/main.js';
  outputFileName = 'wv-test-bundle.js';
}

module.exports = {
  mode: devMode ? 'development' : 'production',
  stats: { // reduce output text on build - remove for more verbose
    chunks: false,
    modules: false,
    children: false
  },
  entry: entryPoint,
  devtool: devMode ? 'cheap-module-eval-source-map' : 'source-map',
  devServer: {
    contentBase: path.join(__dirname, '/web'),
    compress: true,
    hot: true,
    watchContentBase: true, // watch index.html changes
    port: 3000
  },
  output: {
    filename: outputFileName,
    path: path.join(__dirname, '/web/build'),
    pathinfo: false
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          ecma: 5, // dependent on ie11 support
          compress: true,
          mangle: true,
          topLevel: true,
          safari10: true,
          output: {
            comments: false,
            beautify: false
          }
        },
        cache: true,
        parallel: true
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessor: cssnano,
        cssProcessorOptions: {
          discardComments: {
            removeAll: true
          },
          map: {
            inline: false
          }
        }
      })
    ]
  },
  plugins: pluginSystem,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: devMode ? 'babel-loader?cacheDirectory=true' : 'babel-loader',
          options: {
            compact: false // fixes https://stackoverflow.com/questions/29576341/what-does-the-code-generator-has-deoptimised-the-styling-of-some-file-as-it-e
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: 'css-hot-loader'
          },
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              minimize: true,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader', // Run post css actions
            options: {
              sourceMap: true,
              plugins: [
                require('autoprefixer')({
                  // handle browserlist restrictions
                  'browsers': ['last 5 versions', 'not ie < 11', 'not edge < 15', '> 2%']
                })
              ]
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        exclude: /(fontawesome-webfont.svg)/,
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
        test: /((fontawesome-webfont.svg)|(\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?))/,
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
