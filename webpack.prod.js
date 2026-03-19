const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  output: {
    clean: true,
    filename: 'bundle.[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    path: require('path').resolve(__dirname, 'dist'),
    publicPath: '/todolist/' // Ключевое изменение: задаёт базовый путь для ресурсов на GitHub Pages
  },
  optimization: {
    minimize: true, // Исправлено: было "minimize", правильно — "minimize"
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin()
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.[contenthash].css'
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  }
});
