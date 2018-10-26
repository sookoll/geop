const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  optimization: {
    splitChunks: {
      // Must be specified for HtmlWebpackPlugin to work correctly.
      // See: https://github.com/jantimon/html-webpack-plugin/issues/882
      chunks: 'all',
    },
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
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(path.join(__dirname, './dist'), {} ),
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      path: path.join(__dirname, './dist'),
      //template: './src/index.html',
      filename: 'index.html'
    })
  ],
  devServer: {
    port: 3000
  }
}
