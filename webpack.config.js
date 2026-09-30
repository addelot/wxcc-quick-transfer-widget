const path = require('path');

module.exports = {
  entry: './src/quick-transfer.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'quick-transfer.js',
    clean: true
  },
  optimization: {
    minimize: true
  },
  resolve: {
    extensions: ['.js']
  }
};
