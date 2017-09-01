const path = require('path');

module.exports = {
  entry: './web/js/webpack-main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'web/dist')
  }
};
