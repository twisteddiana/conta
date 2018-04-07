module.exports = (grunt) => {
    'use strict';

    require('jit-grunt')(grunt, {
        'ngtemplates': 'grunt-angular-templates',
    });
    grunt.initConfig({
        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                },
                transform: [
                    ["babelify", { "presets": ["es2015", "stage-3"], "plugins": ["transform-object-rest-spread"] }]
                ],
            },
            dist: {
                src: ['static/js/app.js'],
                dest: 'static/dist/index.js',
                browserifyOptions: {
                    detectGlobals: false
                },
                options: {
                    transform: ['browserify-ngannotate'],
                    alias: {},
                },
            }
        },
        watch: {
            options: {
                interval: 1000
            },
            configFiles: {
                files: [ 'Gruntfile.js', 'package.json' ],
                options: {
                    reload: true,
                }
            },
            css: {
                files: ['static/css/**/*'],
                tasks: ['mmcss']
            },
            js: {
                files: ['static/templates/**/*', 'static/js/**/*'],
                tasks: ['mmjs']
            },
        },
        postcss: {
            options: {
                processors: [
                    require('autoprefixer')({ browsers: [
                            'last 2 versions',
                            'Android >= 4.4'
                        ] })
                ]
            },
            dist: {
                src: 'static/dist/*.css'
            }
        },
        ngtemplates: {
            inboxApp: {
                src: [
                    'static/templates/components/**/*.html',
                    'static/templates/utils/**/*.html',
                ],
                dest: 'static/dist/templates.js',
                options: {
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true,
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            }
        },
        less: {
            all: {
                files: {
                    'static/dist/index.css': 'static/css/index.less'
                }
            }
        },
    });

    grunt.registerTask('mmjs', 'Build the JS resources', [
        'browserify:dist',
        'ngtemplates'
    ]);

    grunt.registerTask('mmcss', 'Build the CSS resources', [
        'less',
        'postcss'
    ]);

    grunt.registerTask('build', 'Build the static resources', [
        'mmcss',
        'mmjs',
    ]);

    grunt.registerTask('dev', 'Build and deploy for dev, without reinstalling dependencies.', [
        'build',
        'watch'
    ]);
};
