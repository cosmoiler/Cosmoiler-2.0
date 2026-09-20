const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const zlib = require("zlib");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
//var WebpackPwaManifest = require('webpack-pwa-manifest')

const path = require('path');

function resolvePath(dir) {
  return path.join(__dirname, '..', dir);
}

const env = process.env.NODE_ENV || 'development';

//const path_data = 'c:/Users/Cosmoiler/Documents/Prog/Firmware/ESP32/Cosmoiler/data/';


module.exports = {
  mode: env,
  target: env === "development" ? "web" : "browserslist",
  entry: {
    app: './src/js/app.js',
  },
  output: {
    path: resolvePath('www'),
    filename: '[name].js', // 'js/[name].js'
    chunkFilename: '[name].js', // 'js/[name].js'
    publicPath: '',
    hotUpdateChunkFilename: 'hot/hot-update.js',
    hotUpdateMainFilename: 'hot/hot-update.json',
  },
  resolve: {
    extensions: ['.mjs', '.js', '.svelte', '.json'],
    alias: {
      '@': resolvePath('src'),
    },
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  devtool: env === 'production' ? false : 'eval',
  devServer: {
    // port зафиксирован: на него ссылается задача «web: dev-сервер (webpack serve)»
    // в рабочем пространстве Cosmoiler-AI и launch-конфигурация «Web: Chrome»
    // (умолчание webpack-dev-server — тоже 8080, но пусть будет явно).
    port: 8080,
    hot: true,
    open: true,
    compress: true,
    contentBase: '/www/',
    disableHostCheck: true,
    historyApiFallback: true,
  },
  optimization: {
    concatenateModules: true,
    minimizer: [new TerserPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.(mjs|js|jsx)$/,
        include: [
          resolvePath('src'),
          resolvePath('node_modules/svelte'),
        ],
        use: [
          {
            loader: require.resolve('babel-loader'),

          },
        ]
      },

      {
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader',
          options: {
            emitCss: true,
          },
        },
      },

      {
        test: /\.css$/,
        use: [
          (env === 'development' ? 'style-loader' : {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          }),
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.styl(us)?$/,
        use: [
          (env === 'development' ? 'style-loader' : {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          }),
          'css-loader',
          'postcss-loader',
          'stylus-loader',
        ],
      },
      {
        test: /\.less$/,
        use: [
          (env === 'development' ? 'style-loader' : {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          }),
          'css-loader',
          'postcss-loader',
          'less-loader',
        ],
      },
      {
        test: /\.(sa|sc)ss$/,
        use: [
          (env === 'development' ? 'style-loader' : {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          }),
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: '[name].[ext]', // 'images/[name].[ext]'

        },
        type: 'javascript/auto'
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac|m4a)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name].[ext]',

        },
        type: 'javascript/auto'
      },
      {
        test: /\.(woff?|woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: './[name].[ext]', // 'fonts/[name].[ext]'

        },
        type: 'javascript/auto'
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    //new BundleAnalyzerPlugin(),
    ...(env === 'production' ? [
      new CssMinimizerPlugin(),
      //new BundleAnalyzerPlugin()

      new CompressionPlugin({
        algorithm: "gzip",
        test: /\.(js|css|woff|png)$/,
        threshold: 10000,
        minRatio: 0.8,
        deleteOriginalAssets: false,
      })
    ] : [
      // Development only plugins
      new webpack.HotModuleReplacementPlugin(),

    ]),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './src/index.html',
      inject: true,
      minify: false /* env === 'production' ? {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      } : false, */
    }),
/*     new WebpackPwaManifest({
      name: 'Cosmoiler',
      short_name: 'Cosmoiler',
      description: 'Smart automatic motorcycle chain oiler',
      background_color: '#ecece0',
      theme_color: '#5e3e29',
      crossorigin: 'use-credentials', //can be null, use-credentials or anonymous
      display: "standalone",
      orientation: "portrait",
      fingerprints: false,
      inject: false,
      ios: false,
      icons: [
        {
          src: path.resolve('src/assets/img/icon2.png'),
          sizes: [192, 512], // multiple sizes
          //destination: path.join('icons', 'android')
          ios: false,
          purpose: 'maskable'
        }
      ]
    }), */
    new MiniCssExtractPlugin({
      filename: '[name].css',// 'css/[name].css'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          noErrorOnMissing: true,
          from: resolvePath('src/static/img'),
          to: resolvePath('./www'), //'www/static'
        }
/*         {
          from: resolvePath('/www/'),
          to: path_data,
          force: true,
          globOptions: {
            ignore: ["app.js.LICENSE.txt", "*.css"]
          }
        } */

      ],
    }),


  ],
};
