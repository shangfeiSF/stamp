module.exports = function (grunt) {
  grunt.file.defaultEncoding = 'utf-8'

  grunt.initConfig({
    copy: {
      static: {
        files: [
          {
            cwd: 'main/',
            src: ['background.html', 'icon.png', 'manifest.json'],
            dest: 'bundle/',
            expand: true
          },
          {
            cwd: 'main/lib/',
            src: '*',
            dest: 'bundle/lib/',
            expand: true
          },
          {
            cwd: 'main/popup/',
            src: '*',
            dest: 'bundle/popup/',
            expand: true
          },
          {
            cwd: 'main/injections/scripts/',
            src: ['probe.js'],
            dest: 'bundle/injections/scripts/',
            expand: true
          },
          {
            cwd: 'main/injections/scripts/dwr/',
            src: '*',
            dest: 'bundle/injections/scripts/dwr/',
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
            dest: 'bundle/injections/css/',
            ext: '.css',
            expand: true
          }
        ]
      }
    },

    clean: {
      bundleDir: ['bundle']
    }
  })

  grunt.loadNpmTasks('grunt-text-replace')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-clean')

  grunt.registerTask('reset', [
    'clean:bundleDir'
  ])

  grunt.registerTask('default', [
    'copy:static',
    'less:compiled',
  ])
}