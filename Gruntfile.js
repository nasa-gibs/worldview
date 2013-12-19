var moment = require("./node_modules/moment/moment");

var buildTimestamp = moment.utc().format("MMMM DD, YYYY [-] HH:mm [UTC]");
var buildNonce = moment.utc().format("YYYYMMDDHHmmssSSS");
var revision =

module.exports = function(grunt) {

    var wvJs = grunt.file.readJSON("etc/deploy/wv.js.json");
    var wvCss = grunt.file.readJSON("etc/deploy/wv.css.json");
    var extJs = grunt.file.readJSON("etc/deploy/ext.js.json");
    var extCss = grunt.file.readJSON("etc/deploy/ext.css.json");
    var banner = grunt.file.read("etc/deploy/banner.txt");

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        "git-rev-parse": {
            build: {
                options: {
                    prop: 'git-revision',
                    number: 6
                }
            }
        },

        copy: {
            config: {
                files: [
                    { expand: true, cwd: "etc/config/",
                      src: "config/**", dest: "build" }
                ]
            },
            web: {
                files: [
                    { expand: true, cwd: "src",
                      src: "**", dest: "build/worldview-debug/web" }
                ]
            },
            bin: {
                files: [
                    { expand: true, cwd: "bin",
                      src: "**", dest: "build/worldview-debug/bin" }
                ]
            },
            concat: {
                files: [
                    { expand: false, src: "build/worldview.js",
                      dest: "build/worldview-debug/web" },
                    { expand: false, src: "build/worldview.css",
                      dest: "build/worldview-debug/web" }
                ]
            },
            release: {
                files: [
                    { expand: true, cwd: "build/worldview-debug",
                      src: ["**", "!**/*.js", "!**/*.css"],
                      dest: "build/worldview" },
                    { expand: true, cwd: "build/worldview-debug/web",
                      src: [
                        "css/pages.css",
                        "css/bulkDownload.css",
                        "js/Worldview/Map/TileWorker.js"
                      ],
                      dest: "build/worldview/web" }
                ]
            },
            ext: {
                files: [
                    { expand: true,
                      cwd: "build/worldview-debug/web/ext/jquery.dd",
                      src: ["**"], dest: "build/worldview-debug/web/ext" },
                    { expand: true,
                      cwd: "build/worldview-debug/web/ext/jquery.mobile",
                      src: ["**"], dest: "build/worldview-debug/web/ext" },
                    { expand: true,
                      cwd: "build/worldview-debug/web/ext/yui",
                      src: ["**"], dest: "build/worldview-debug/web/ext" },
                    { expand: true, cwd: "build/worldview-debug/web/ext/jcrop",
                      src: ["*.gif"], dest: "build/worldview-debug/web/ext" },
                ]
            }
        },

        exec: {
            act: {
                command: "python etc/config/act2json.py build/config/palettes"
            },
            vrt: {
                command: "python etc/config/vrt2json.py " +
                            "--layers-dir build/config/layers " +
                            "build/config/palettes"
            },
            config: {
                command: "python etc/config/generate-config.py " +
                            "--config-dir build/config " +
                            "--output build/worldview-debug/web/data/config.json"
            },
            config_min: {
                command: "python etc/config/generate-config.py " +
                            "--config-dir build/config " +
                            "--minify " +
                            "--output build/config.min.json"
            },
            config_src: {
                command: "python etc/config/generate-config.py " +
                            "--config-dir build/config " +
                            "--output src/data/config.json"
            },
            empty: {
                command: "find build -type d -empty -delete"
            }
        },

        replace: {
            timestamp: {
                src: ["build/worldview-debug/web/js/Worldview.js"],
                overwrite: true,
                replacements: [{
                    from: "@BUILD_TIMESTAMP@",
                    to: buildTimestamp
                }]
            },
            version: {
                src: ["build/worldview-debug/web/js/Worldview.js"],
                overwrite: true,
                replacements: [{
                    from: "@BUILD_VERSION@",
                    to: "<%= pkg.version %>"
                }]
            },
            nonce: {
                src: [
                    "build/worldview-debug/web/**/*.html",
                    "build/worldview-debug/web/**/*.js"
                ],
                overwrite: true,
                replacements: [{
                    from: "@BUILD_NONCE@",
                    to: buildNonce
                }]
            },
            links: {
                src: ["build/worldview-debug/web/**/*.html"],
                overwrite: true,
                replacements: [{
                    from: /.*link.dev.*/g,
                    to: ""
                }, {
                    from: /.*link.prod.*!--(.*)--.*/g,
                    to: "$1"
                }]
            }
        },

        concat: {
            wv_js: {
                src: wvJs,
                dest: "build/worldview-debug/web/js/wv.js"
            },
            wv_css: {
                src: wvCss,
                dest: "build/worldview-debug/web/css/wv.css"
            },
            ext_js: {
                src: extJs,
                dest: "build/worldview-debug/web/ext/ext.js"
            },
            ext_css: {
                src: extCss,
                dest: "build/worldview-debug/web/ext/ext.css"
            }
        },

        uglify: {
            wv_js: {
                options: {
                    banner: banner
                },
                files: {
                    "build/worldview/web/js/wv.js": [
                        "build/worldview-debug/web/js/wv.js"
                    ]
                }
            },
            ext_js: {
                files: {
                    "build/worldview/web/ext/ext.js": [
                        "build/worldview-debug/web/ext/ext.js"
                    ]
                }
            }

        },

        cssmin: {
            wv_css: {
                options: {
                    banner: banner,
                    keepSpecialComments: false
                },
                files: {
                    "build/worldview/web/css/wv.css": [
                        "build/worldview-debug/web/css/wv.css"
                    ]
                }
            },
            ext_css: {
                options: {
                    banner: banner,
                    keepSpecialComments: false
                },
                files: {
                    "build/worldview/web/ext/ext.css": [
                        "build/worldview-debug/web/ext/ext.css"
                    ]
                }
            },
        },

        lineremover: {
            release: {
                files: {
                    "build/worldview/web/index.html": "build/worldview/web/index.html"
                }
            }
        },

        compress: {
            debug_versioned: {
                options: {
                    archive: "dist/" +
                             "<%= pkg.name %>" +
                             "-debug" +
                             "-<%= pkg.version %>" +
                             "-git<%= grunt.config.get('git-revision') %>" +
                             ".tar.gz"
                },
                files: [{
                    expand: true, cwd: "build/worldview-debug/", src: ["**"],
                    dest: "worldview-debug"
                }]
            },
            debug: {
                options: {
                    archive: "dist/worldview-debug.tar.gz"
                },
                files: [{
                    expand: true, cwd: "build/worldview-debug/", src: ["**"],
                    dest: "worldview-debug"
                }]
            },
            release_versioned: {
                options: {
                    archive: "dist/" +
                             "<%= pkg.name %>" +
                             "-<%= pkg.version %>" +
                             "-git<%= grunt.config.get('git-revision') %>" +
                             ".tar.gz"
                },
                files: [{
                    expand: true, cwd: "build/worldview/", src: ["**"],
                    dest: "worldview"
                }]
            },
            release: {
                options: {
                    archive: "dist/worldview.tar.gz"
                },
                files: [{
                    expand: true, cwd: "build/worldview/", src: ["**"],
                    dest: "worldview"
                }]
            },
        },

        remove: {
            build: ["build"],
            dist: ["dist"],
            source: [
                "build/worldview-debug/web/**/*.css",
                "build/worldview-debug/web/**/*.js",
                "build/worldview-debug/web/ext/**/version*",
                "!build/worldview-debug/web/css/wv.css",
                "!build/worldview-debug/web/js/wv.js",
                "!build/worldview-debug/web/ext/ext.css",
                "!build/worldview-debug/web/ext/ext.js",
                "!build/worldview-debug/web/css/pages.css",
                "!build/worldview-debug/web/css/bulkDownload.css",
                "!build/worldview-debug/web/js/Worldview/Map/TileWorker.js"
            ],
            dist_tar: ["dist/*.tar.gz"]
        }

    });

    grunt.file.mkdir("build");
    grunt.file.mkdir("dist");

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-line-remover");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-git-rev-parse");
    grunt.loadNpmTasks("grunt-text-replace");

    grunt.renameTask("clean", "remove");
    grunt.task.run("git-rev-parse");

    grunt.registerTask("config", [
        "clean",
        "copy:config",
        "exec:act",
        "exec:vrt",
        "exec:config_src",
    ]);

    grunt.registerTask("build", [
        "clean",
        "copy:web",
        "copy:bin",
        "replace:timestamp",
        "replace:nonce",
        "replace:version",
        "copy:config",
        "exec:act",
        "exec:vrt",
        "exec:config",
        "concat",
        "replace:links",
        "copy:ext",
        "remove:source",
        "copy:release",
        "uglify",
        "cssmin",
        "lineremover",
        "exec:empty",
        "remove:dist_tar",
        "compress"
    ]);

    grunt.registerTask("clean", "remove:build");
    grunt.registerTask("distclean", ["remove:build", "remove:dist"]);

    grunt.registerTask("default", "build");

};