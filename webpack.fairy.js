module.exports = {
  entry: './main/injections/scripts/fairy',
  output: {
    filename: './build/injections/scripts/fairy.js'
  },
  resolve: {
    extensions: ['.js'],
    modulesDirectories: ['./modules']
  }
}
