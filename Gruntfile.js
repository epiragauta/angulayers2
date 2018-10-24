module.exports = function (grunt) {

    // Load Grunt tasks declared in the package.json file
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({

        clean: ["dist", ".tmp"],

        uglify: {
            options: {
                report: 'min',
                mangle: false
            },
            dist: {
                files: {
                    'dist/angulayers2.min.js': ['dist/angulayers2.js']
                }
            }
        },

        concat: {
            dist: {
                src: [
                    'src/**/*.js'
                ],
                dest: 'dist/angulayers2.js'
            }
        }
    });

    // Creates the `server` task
    grunt.registerTask('dist', [
        'clean',
        'concat:dist',
        'uglify:dist'
    ]);

};