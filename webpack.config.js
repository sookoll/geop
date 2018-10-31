const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')

module.exports = {
  optimization: {
    splitChunks: {
      // Must be specified for HtmlWebpackPlugin to work correctly.
      // See: https://github.com/jantimon/html-webpack-plugin/issues/882
      chunks: 'all'
    }
  },
  devtool: 'source-map',
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
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
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
        use: ['file-loader'],
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
  plugins: [
    new CleanWebpackPlugin(path.join(__dirname, 'dist'), {} ),
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      path: path.join(__dirname, 'dist'),
      template: path.join(__dirname, 'src', 'index.html'),
      filename: 'index.html'
    }),
    // leave it last!!
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      swDest: 'sw.js',
      clientsClaim: true,
      skipWaiting: true
    })
  ],
  devServer: {
    port: 3000
  }
}
