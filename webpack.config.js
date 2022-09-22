const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

const pluginSystem = [
  new HtmlWebpackPlugin({
    hash: true,
    title: 'Worldview',
    filename: 'web/index.html',
    inject: false,
  }),
  new MiniCssExtractPlugin({
    filename: 'wv.css',
  }),
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
  mode: devMode ? 'development' : 'production',
  entry: './web/js/main.js',
  output: {
    filename: 'wv.js',
    path: path.resolve(__dirname, 'web/build/'),
    publicPath: '/',
    pathinfo: false,
    clean: true,
  },
  devtool: devMode ? 'cheap-module-source-map' : 'source-map',
  devServer: {
    devMiddleware: {
      writeToDisk: true,
    },
    static: path.join(__dirname, 'web'),
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 5,
          toplevel: true,
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
            loader: MiniCssExtractPlugin.loader,
          },
          'css-hot-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              postcssOptions: {
                plugins: [
                  'cssnano',
                  'autoprefixer',
                ],
              },
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
  resolve: {
    alias: {
      googleTagManager$: path.resolve(
        __dirname,
        './web/js/components/util/google-tag-manager.js',
      ),
    },
    fallback: {
      fs: false,
    },
  },
  stats: {
    // reduce output text on build - remove for more verbose
    chunks: false,
    modules: false,
    children: false,
  },
};
