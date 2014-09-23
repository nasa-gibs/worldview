/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var fs = require("fs")

module.exports = function(grunt) {

    var options = {
        version: 0,
        release: 0
    };

    if ( fs.existsSync("options/version.json") ) {
        options = grunt.file.readJSON("options/version.json");
    }

    // Lists of JavaScript and CSS files to include and in the correct
    // order
    var js   = grunt.file.readJSON("deploy/wv.js.json");
    var css  = grunt.file.readJSON("deploy/wv.css.json");

    // Copyright notice to place at the top of the minified JavaScript and
    // CSS files
    var banner = grunt.file.read("deploy/banner.txt");

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        opt: options,

        buster: {
            console: {},
            report: {
                test: {
                    reporter: "xml"
                }
            }
        },

        concat: {
            // Combine all the Worldview JavaScript files into one file.
            js: {
                src: js["wv.js"],
                dest: "build/worldview-debug/web/js/wv.js",
            },
            // Combine all the Worldview CSS files into one file.
            css: {
                src: css,
                dest: "build/worldview-debug/web/css/wv.css"
            }
        },

        copy: {
            config_src: {
                files: [
                    { expand: true, cwd: "build/options/config",
                      src: ["**"], dest: "web/config" },
                    { expand: true, cwd: "build/options/brand",
                      src: ["**"], dest: "web/brand" }
                ]
            },

            // Copies the source files to the build directory
            source: {
                files: [{
                    expand: true, cwd: ".",
                    src: [
                        "bin/**",
                        "deploy/**",
                        "web/**",
                        "*",
                        "web/**/.htaccess",
                        "!web/brand/**",
                        "!web/config/**",
                        "!web/var/**"
                    ],
                    dest: "build/worldview-debug",
                }]
            },

            release: {
                files: [{
                    expand: true, cwd: "build/worldview-debug",
                    src: ["**", "**/.htaccess"],
                    dest: "build/worldview"
                }]
            },

            dist_config_versioned: {
                files: [{
                    src: "dist/worldview-config.tar.bz2",
                    dest: "dist/worldview-config" +
                        "-<%=opt.version%>" +
                        "-<%=opt.release%>" +
                        ".git<%= grunt.config.get('config-revision') %>" +
                        ".tar.bz2"
                }]
            },

            dist_source_debug_versioned: {
                files: [{
                    src: "dist/worldview-debug.tar.bz2",
                    dest: "dist/worldview-debug" +
                        "-<%=pkg.version%>" +
                        "-<%=pkg.release%>" +
                        ".git<%= grunt.config.get('source-revision') %>" +
                        ".tar.bz2"
                }]
            },

            dist_source_release_versioned: {
                files: [{
                    src: "dist/worldview.tar.bz2",
                    dest: "dist/worldview" +
                        "-<%=pkg.version%>" +
                        "-<%=pkg.release%>" +
                        ".git<%= grunt.config.get('source-revision') %>" +
                        ".tar.bz2"
                }]
            }
        },

        cssmin: {
            // Minifiy the concatenated Worldview CSS file.
            wv_css: {
                options: {
                    banner: banner,
                    keepSpecialComments: false
                },
                files: {
                    "build/worldview/web/css/wv.css": [
                        "build/worldview/web/css/wv.css"
                    ]
                }
            }
        },

        exec: {
            cgi: {
                command: "chmod 755 build/*/web/service/*/*.cgi"
            },

            config: {
                command: "PATH=python/bin:${PATH} bin/wv-options-build"
            },

            // After removing JavaScript and CSS files that are no longer
            // need in a release build, there are a lot of empty directories.
            // Remove all of them.
            empty: {
                command: "find build -type d -empty -delete"
            },

            tar_config: {
                command: "tar cjCf build dist/worldview-config.tar.bz2 " +
                            "options"
            },

            tar_source_debug: {
                command: "tar cjCf build dist/worldview-debug.tar.bz2 " +
                            "worldview-debug"
            },

            tar_source_release: {
                command: "tar cjCf build dist/worldview.tar.bz2 " +
                            "worldview"
            }
        },

        "git-rev-parse": {
            source: {
                options: {
                    prop: "source-revision",
                    number: 6
                }
            },
            config: {
                options: {
                    prop: "config-revision",
                    cwd: "options",
                    number: 6
                }
            }
        },

        lineremover: {
            // After removing all the <!-- link.dev --> references, there
            // are a lot of blank lines in index.html. Remove them
            release: {
                files: [{
                    expand: true, cwd: "build",
                    src: ["**/web/**/*.html"],
                    dest: "build"
                }]
            }
        },

        markdown: {
            metadata: {
                files: [
                    {
                      expand: true,
                      cwd: "build/options/config/metadata",
                      src: "**/*.md",
                      dest: "build/options/config/metadata",
                      ext: ".html"
                  },
                ],
                options: {
                    template: "deploy/metadata.template.html"
                }
            },
            new: {
                files: [
                    {
                        expand: true,
                        cwd: "build/options/brand/pages",
                        src: "**/*.md",
                        dest: "build/options/brand/pages",
                        ext: ".html"
                    }
                ],
                options: {
                    template: "deploy/new.template.html"
                }
            }
        },

        mkdir: {
            dist: {
                options: {
                    create: ["dist"]
                }
            }
        },

        remove: {
            build: ["build"],
            dist: ["dist"],
            // Removes all JavaScript, CSS, and auxillary files not necessary
            // in a release build. Place exceptions for JavaScript and
            // CSS here.
            source: [
                "build/worldview-debug/web/css/**/*.css",
                "build/worldview-debug/web/**/*.js",
                "!build/worldview-debug/web/css/wv.css",
                "!build/worldview-debug/web/js/wv.js",
                "!build/worldview-debug/web/css/bulkDownload.css",
                "!build/worldview-debug/web/js/map/wv.map.tileworker.js",
                "!build/worldview-debug/web/ext/**/*"
            ],
            config_src: [
                "web/config/**/*"
            ]
        },

        replace: {
            // Remove all development links <!-- link.dev --> and uncomment
            // all the release links <1-- link.prod -->
            links: {
                src: [
                   "build/**/web/index.html",
                   "build/**/web/pages/*.html",
                ],
                overwrite: true,
                replacements: [{
                    from: /.*link.dev.*/g,
                    to: ""
                }, {
                    from: /.*link.prod.*(!--|\/\*)(.*)(--|\*\/).*/g,
                    to: "$2"
                }]
            },
        },

        jshint: {
            console: [
                "web/js/**/wv.*.js",
                "test/**/*.js",
            ],
            report: {
                options: {
                    reporter: "checkstyle",
                },
                files: {
                    src: [
                        "web/js/**/wv.*.js",
                        "test/**/*.js",
                    ]
                }
            }
        },

        uglify: {
            // Minifiy the concatenated Worldview JavaScript file.
            wv_js: {
                options: {
                    banner: banner
                },
                files: {
                    "build/worldview/web/js/wv.js": [
                        "build/worldview/web/js/wv.js"
                    ]
                }
            }
        },

    });

    grunt.loadNpmTasks("grunt-buster");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-csslint");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-line-remover");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-git-rev-parse");
    grunt.loadNpmTasks("grunt-markdown");
    grunt.loadNpmTasks("grunt-minjson");
    grunt.loadNpmTasks("grunt-mkdir");
    grunt.loadNpmTasks("grunt-text-replace");
    grunt.loadNpmTasks("grunt-rename");

    // Lets use "clean" as a target instead of the name of the task
    grunt.renameTask("clean", "remove");

    // Make sure these directories exist
    grunt.file.mkdir("build/rpmbuild");
    grunt.file.mkdir("dist");

    grunt.registerTask("build", [
        "clean",
        "git-rev-parse:source",
        "copy:source",
        "concat",
        "remove:source",
        "exec:empty",
        "copy:release",
        "uglify",
        "cssmin",
        "replace:links",
        "lineremover",
        "exec:cgi",
        "mkdir:dist",
        "exec:tar_source_debug",
        "copy:dist_source_debug_versioned",
        "exec:tar_source_release",
        "copy:dist_source_release_versioned"
    ]);

    grunt.registerTask("config", [
        "clean",
        "git-rev-parse:config",
        "remove:config_src",
        "exec:config",
        "markdown",
        "copy:config_src",
        "mkdir:dist",
        "exec:tar_config",
        "copy:dist_config_versioned"
    ]);

    grunt.registerTask("check", ["lint", "test"]);
    grunt.registerTask("clean", ["remove:build"]);
    grunt.registerTask("distclean", ["remove:build", "remove:dist"]);
    grunt.registerTask("lint", ["jshint:console"]);
    grunt.registerTask("test", ["buster:console"]);

    grunt.registerTask("default", ["build"]);
};
