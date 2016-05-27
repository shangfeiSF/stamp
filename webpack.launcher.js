module.exports = {
  entry: './main/injections/scripts/launcher',
  output: {
    filename: './build/injections/scripts/launcher.js'
  },
  resolve: {
    extensions: ['.js'],
    modulesDirectories: ['./modules']
  }
}
