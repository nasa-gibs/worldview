const path = require('path')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const TerserPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const CssUrlRelativePlugin = require('css-url-relative-plugin')

const devMode = process.env.NODE_ENV !== 'production'

const pluginSystem = [
  new MomentLocalesPlugin(),
  new CssUrlRelativePlugin(),
  new MiniCssExtractPlugin({
    filename: 'wv.css'
  }),
  new webpack.DefinePlugin({
    'process.env.GITHUB_ACTIONS': JSON.stringify(process.env.GITHUB_ACTIONS || 'false')
  })
]

/* Conditional Plugin Management */
if (devMode) {
  pluginSystem.push(
    new ReactRefreshWebpackPlugin()
  )
}

if (process.env.ANALYZE_MODE === 'true') {
  pluginSystem.push(new BundleAnalyzerPlugin())
}

if (process.env.DEBUG !== undefined) {
  pluginSystem.push(
    new webpack.DefinePlugin({ DEBUG: JSON.stringify(process.env.DEBUG) })
  )
} else {
  pluginSystem.push(
    new webpack.DefinePlugin({ DEBUG: false })
  )
}

const babelLoaderExcludes = [
  /\.test\.js$/,
  /fixtures\.js$/,
  /core-js/
]
// Include any modules that need to be transpiled by babel-loader
const transpileDependencies = [
  'react-visibility-sensor'
]
if (devMode) {
  // Don't transpile any dependencies in /node_modules except those found
  // in transpileDependencies array
  babelLoaderExcludes.push(
    new RegExp(`node_modules(?!(/|\\\\)(${transpileDependencies.join('|')})).*`)
  )
}

module.exports = {
  mode: devMode ? 'development' : 'production',
  entry: './web/js/main.js',
  output: {
    filename: 'wv.js',
    path: path.resolve(__dirname, 'web/build/'),
    publicPath: './',
    pathinfo: false,
    clean: true
  },
  devtool: devMode && 'source-map',
  devServer: {
    devMiddleware: {
      writeToDisk: true
    },
    static: path.join(__dirname, 'web'),
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 5,
          toplevel: true
        }
      }),
      new CssMinimizerPlugin()
    ]
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
            plugins: [devMode && require.resolve('react-refresh/babel')].filter(Boolean)
          }
        },
        exclude: babelLoaderExcludes
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'cssnano',
                  'autoprefixer'
                ]
              }
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
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext][query]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]'
        }
      }
    ]
  },
  resolve: {
    alias: {
      googleTagManager$: path.resolve(
        __dirname,
        './web/js/components/util/google-tag-manager.js'
      )
    },
    fallback: {
      fs: false
    },
    modules: ['node_modules', path.resolve(__dirname, 'web/scss')]
  },
  stats: {
    // reduce output text on build - remove for more verbose
    chunks: false,
    modules: false,
    children: false
  }
}
