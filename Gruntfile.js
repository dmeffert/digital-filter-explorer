module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    cssmin: {
        minify: {
            expand: true,
            cwd: 'css/',
            src: ['normalize.css', 'main.css', '!*.min.css'],
            dest: 'css/',
            ext: '.min.css'
        },
        combine: {
            files: {
                'css/filter-explorer.min.css': ['css/normalize.min.css', 'css/ui-darkness/jquery-ui-1.10.3.custom.min.css', 'css/main.min.css']
            }
        },
        add_banner: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            files: {
                'css/filter-explorer.min.css': ['css/filter-explorer.min.css']
            }
        }

    },
    jshint: {
        all: ['Gruntfile.js', 'js/*.js']
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: "js",
          mainConfigFile: "js/main.js",
          out: "js/filter-explorer.min.js",
          name: 'lib/almond',
          include: 'main',

          done: function(done, output) {
            var duplicates = require('rjs-build-analysis').duplicates(output);

            if (duplicates.length > 0) {
              grunt.log.subhead('Duplicates found in requirejs build:');
              grunt.log.warn(duplicates);
              done(new Error('r.js built duplicate modules, please check the excludes option.'));
            }

            done();
          }
        }
      }
    },
    docco: {
      debug: {
        src: ['js/!(*.min).js'],
        options: {
          output: 'docs/',
          template: 'docco-mathjax.jst'
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 9000,
          keepalive: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.registerTask('default', ['cssmin', 'requirejs']);
};