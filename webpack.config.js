const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const devMode = process.env.NODE_ENV !== 'production';

const pluginSystem = [
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
];

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

module.exports = {
  mode: devMode ? 'development' : 'production',
  stats: { // reduce output text on build - remove for more verbose
    chunks: false,
    modules: false,
    children: false
  },
  entry: './web/js/main.js',
  // devtool: 'cheap-module-eval-source-map',
  devtool: 'cheap-module-source-map',
  devServer: {
    contentBase: path.join(__dirname, '/web'),
    compress: true,
    hot: true,
    watchContentBase: true, // watch index.html changes
    port: 3000
  },
  output: {
    filename: 'wv.js',
    chunkFilename: 'wv-chunk.js',
    path: path.join(__dirname, '/web/build'),
    pathinfo: false
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          ecma: 5,
          compress: true,
          mangle: true,
          topLevel: true,
          ie8: false,
          output: {
            comments: false,
            beautify: false
          }
        },
        cache: true,
        parallel: 2
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessor: require('cssnano'),
        cssProcessorOptions: {
          discardComments: {
            removeAll: true
          },
          map: {
            inline: false,
            annotation: true
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
        // exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            compact: false
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
              plugins: [
                require('autoprefixer')({
                  // handle browserlist restrictions
                  'browsers': ['last 5 versions', 'not ie < 11', 'not edge < 15', '> 2%']
                })
              ]
            }
          },
          {
            loader: 'sass-loader'
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
