const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const postcssPresetEnv = require('postcss-preset-env');
// production optimizations
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
// environment dev flag
const devMode = process.env.NODE_ENV !== 'production';
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const pluginSystem = [
  new CleanWebpackPlugin(),
  new HtmlWebpackPlugin({
    hash: true,
    title: 'Worldview',
    filename: 'web/index.html',
    inject: false,
  }),
  new MiniCssExtractPlugin({
    filename: 'wv.css',
  }),
  new WriteFilePlugin(),
  new MomentLocalesPlugin(),
];

/* Conditional Plugin Management */
if (devMode) {
  pluginSystem.push(
    new ReactRefreshWebpackPlugin(),
  );
}
if (process.env.ANALYZE_MODE === 'true') {
  pluginSystem.push(new BundleAnalyzerPlugin());
}
if (process.env.DEBUG !== undefined) {
  pluginSystem.push(
    new webpack.DefinePlugin({ DEBUG: JSON.stringify(process.env.DEBUG) }),
  );
} else {
  pluginSystem.push(
    new webpack.DefinePlugin({ DEBUG: false }),
  );
}

const babelLoaderExcludes = [
  /\.test\.js$/,
  /fixtures\.js$/,
  /core-js/,
];
// Inlucde any modules that need to be transpiled by babel-loader
const transpileDependencies = [
  'react-visibility-sensor',
];
if (devMode) {
  // Don't transpile any dependencies in /node_modules except those found
  // in transpileDependencies array
  babelLoaderExcludes.push(
    new RegExp(`node_modules(?!(/|\\\\)(${transpileDependencies.join('|')})).*`),
  );
}

module.exports = {
  resolve: {
    alias: {
      googleTagManager$: path.resolve(
        __dirname,
        './web/js/components/util/google-tag-manager.js',
      ),
    },
  },
  mode: devMode ? 'development' : 'production',
  stats: {
    // reduce output text on build - remove for more verbose
    chunks: false,
    modules: false,
    children: false,
  },
  entry: './web/js/main.js',
  devtool: devMode ? 'cheap-module-source-map' : 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, '/web'),
    },
    compress: true,
    port: 3000,
    host: '0.0.0.0',
    liveReload: false,
    hot: true,
    historyApiFallback: true,
  },
  output: {
    filename: 'wv.js',
    path: path.join(__dirname, '/web/build/'),
    pathinfo: false,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 5,
          parallel: true,
          toplevel: true,
          extractComments: true,
        },
      }),
      new CssMinimizerPlugin(),
    ],
  },
  plugins: pluginSystem,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            compact: false, // fixes https://stackoverflow.com/questions/29576341/what-does-the-code-generator-has-deoptimised-the-styling-of-some-file-as-it-e
            cacheDirectory: devMode,
            plugins: [devMode && require.resolve('react-refresh/babel')].filter(Boolean),
          },
        },
        exclude: babelLoaderExcludes,
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: 'css-hot-loader',
          },
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader', // Run post css actions
            options: {
              sourceMap: true,
              ident: 'postcss',
              plugins: () => [
                postcssPresetEnv({
                  browserslist: [
                    'last 4 versions',
                    'not ie < 11',
                    'not edge < 17',
                    'not IE_Mob 11',
                    'not dead',
                    '> 2%',
                  ],
                }),
              ],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        exclude: /(fontawesome-webfont.svg)/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'images/',
          },
        },
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: {
          // handle font-awesome fonts
          loader: 'url-loader?limit=10000&mimetype=application/font-woff',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/',
          },
        },
      },
      {
        test: /((fontawesome-webfont.svg)|(\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?))/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/',
          },
        },
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: !devMode,
              removeEmptyAttributes: !devMode,
              sortAttributes: !devMode,
              sortClassName: !devMode,
            },
          },
        ],
      },
    ],
  },
  node: { fs: 'empty' },
};
