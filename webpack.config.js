const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const WebpackPwaManifest = require('webpack-pwa-manifest')

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
      Conf: path.join(__dirname, 'src', 'config'),
      Root: path.join(__dirname, 'src')
    },
    extensions: ['*', '.js', '.json']
  },
  devServer: {
    port: 3000
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new CleanWebpackPlugin(path.join(__dirname, 'dist'), {} ),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'favicon.ico'),
        to: path.join(__dirname, 'dist', 'favicon.ico')
      },
      {
        from: path.join(__dirname, 'src', 'CNAME'),
        to: path.join(__dirname, 'dist')
      }
    ]),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new HtmlWebpackPlugin({
      hash: true,
      path: path.join(__dirname, 'dist'),
      template: path.join(__dirname, 'src', 'index.html'),
      filename: 'index.html',
      title: 'Geop'
    }),
    new WebpackPwaManifest({
      name: 'Geop by sookoll',
      short_name: 'Geop',
      description: 'Geop - Geocaching map',
      display: 'standalone',
      orientation: 'any',
      start_url: '.',
      background_color: '#6c757d',
      theme_color: '#6c757d',
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
