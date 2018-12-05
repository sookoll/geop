const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const WebpackPwaManifest = require('webpack-pwa-manifest')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = {
  optimization: {
    splitChunks: {
      // Must be specified for HtmlWebpackPlugin to work correctly.
      // See: https://github.com/jantimon/html-webpack-plugin/issues/882
      chunks: 'all'
    }
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js?$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
        options: {
          fix: true
        }
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules\/(?!(ol)\/)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { useBuiltIns: 'usage' }]
            ]
          }
        }
      },
      {
        test: /\.styl(us)?$/,
        use: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.(svg|woff|woff2|ttf|eot|otf)(\?.*)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            outputPath: 'assets/'
          }
        }]
      }
    ]
  },
  resolve: {
    alias: {
      Utilities: path.join(__dirname, 'src', 'geop', 'utilities'),
      Components: path.join(__dirname, 'src', 'geop', 'components'),
      Geop: path.join(__dirname, 'src', 'geop'),
      Conf: path.join(__dirname, 'src', 'config')
    },
    extensions: ['*', '.js', '.json']
  },
  devServer: {
    port: 3000
  },
  devtool: 'source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new CleanWebpackPlugin(path.join(__dirname, 'dist'), {} ),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      path: path.join(__dirname, 'dist'),
      template: path.join(__dirname, 'src', 'index.html'),
      filename: 'index.html'
    }),
    new WebpackPwaManifest({
      name: 'Geocaching Map Tool',
      short_name: 'Geop',
      description: 'Simple map tool for Geocaching',
      display: 'standalone',
      start_url: '/',
      background_color: '#000000',
      crossorigin: null, //can be null, use-credentials or anonymous
      ios: true,
      icons: [{
        src: path.join(__dirname, 'src', 'logo.png'),
        destination: 'assets/',
        sizes: [96, 128, 192, 256, 384, 512] // multiple sizes
      }]
    }),
    // leave it last!!
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      swDest: 'sw.js',
      clientsClaim: true,
      skipWaiting: true
    })
  ]
}
