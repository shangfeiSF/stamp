module.exports = function (grunt) {
  grunt.file.defaultEncoding = 'utf-8'

  grunt.initConfig({
    replace: {
      tmp: {
        src: ["./main/background.js"],
        dest: ["./main/background.webpack.js"],
        replacements: [
          {
            from: "./main/",
            to: "./build/"
          }
        ]
      }
    },

    copy: {
      static: {
        files: [
          {
            cwd: 'main/',
            src: ['background.html', 'icon.png'],
            dest: 'build/',
            expand: true
          },
          {
            cwd: 'main/popup/',
            src: '*',
            dest: 'build/popup/',
            expand: true
          },
          {
            cwd: 'main/injections/scripts/',
            src: ['probe.js'],
            dest: 'build/injections/scripts/',
            expand: true
          }, {
            cwd: 'main/injections/scripts/dwr/',
            src: ['engine.js', 'utils.js', 'shoppingCartAction.js'],
            dest: 'build/injections/scripts/dwr/',
            expand: true
          }]
      }
    },

    less: {
      compiled: {
        files: [
          {
            cwd: 'main/injections/css/',
            src: '*.less',
            dest: 'build/injections/css/',
            ext: '.css',
            expand: true
          }
        ]
      }
    },

    clean: {
      buildDir: ['build'],
      tmp: './main/background.webpack.js'
    }
  })

  grunt.loadNpmTasks('grunt-text-replace')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-clean')

  grunt.registerTask('build', [
    'replace:tmp',
    'copy:static',
    'less:compiled'
  ])
  grunt.registerTask('clear', [
    'clean:tmp'
  ])
  grunt.registerTask('reset567890', [
    'clean:buildDir'
  ])

  grunt.registerTask('default', [
    'replace:tmp',
    'copy:static',
    'less:compiled'
  ])
}