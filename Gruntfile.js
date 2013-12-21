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
var moment = require("./node_modules/moment/moment");

var buildTimestamp = moment.utc().format("MMMM DD, YYYY [-] HH:mm [UTC]");
var buildNonce = moment.utc().format("YYYYMMDDHHmmssSSS");

var buildNumber = ( process.env.BUILD_NUMBER ) 
    ? "." + process.env.BUILD_NUMBER : "";

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
            // Copies all configuration files to the build directory.
            // Generating the master file may change the source files and this
            // keeps the originals pristine.
            config: {
                files: [
                    { expand: true, cwd: "etc/config/",
                      src: "config/**", dest: "build" }
                ]
            },
            // Copies the web root from the source directory to the build
            // directory
            web: {
                files: [
                    { expand: true, cwd: "src",
                      src: "**", dest: "build/worldview-debug/web" }
                ]
            },

            // Copies the auxillary binary files and/or scripts from the
            // source directory to the build directory.
            bin: {
                files: [
                    { expand: true, cwd: "bin",
                      src: "**", dest: "build/worldview-debug/bin" }
                ]
            },
            // Copies the concatenated JavaScript and CSS files to the
            // final location in the release web root being built.
            concat: {
                files: [
                    { expand: false, src: "build/worldview.js",
                      dest: "build/worldview-debug/web" },
                    { expand: false, src: "build/worldview.css",
                      dest: "build/worldview-debug/web" }
                ]
            },
            // Copies the finished version of the debugging web root to
            // create a release web root. JavaScript and CSS files are omitted
            // since the concatenated version is used instead. Files that
            // must be included in non-concatenated form should be copied
            // over too
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
            // Since the location of the CSS changes when using the
            // concatenated file. "hoist" up all the dependencies found
            // in the ext directory by one directory.
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
            },

            rpm_sources: {
                files: [
                    { expand: true, cwd: "etc/deploy/sources",
                      src: ["**"], dest: "build/rpmbuild/SOURCES" },
                    { expand: true, cwd: "etc/deploy", 
                      src: ["worldview.spec"], dest: "build/rpmbuild/SPECS" },
                    { expand: true, cwd: "dist",
                      src: ["worldview.tar.gz", "worldview-debug.tar.gz"],
                      dest: "build/rpmbuild/SOURCES" }
	        ]
            },

            rpm: {
                files: [
                    { expand: true, flatten: true, cwd: "build/rpmbuild",
                      src: ["**/*.rpm"], dest: "dist" }
                ]
            }
        },

        exec: {
            // Create Worldview color palettes from ACT files provided by
            // the Earth Observatory
            act: {
                command: "python etc/config/act2json.py build/config/palettes"
            },
            // Create Worldview color palettes from VRT files provided by
            // the GIBS team
            vrt: {
                command: "python etc/config/vrt2json.py " +
                            "--layers-dir build/config/layers " +
                            "build/config/palettes"
            },
            // Combine all configuration json files into one.
            config: {
                command: "python etc/config/generate-config.py " +
                            "--config-dir build/config " +
                            "--output build/worldview-debug/web/data/config.json"
            },
            // Create a minified verison of the configuration file for
            // the release web root.
            config_min: {
                command: "python etc/config/generate-config.py " +
                            "--config-dir build/config " +
                            "--minify " +
                            "--output build/config.min.json"
            },
            // Creates a combined configuration file for use in the source
            // tree
            config_src: {
                command: "python etc/config/generate-config.py " +
                            "--config-dir build/config " +
                            "--output src/data/config.json"
            },
            // After removing JavaScript and CSS files that are no longer
            // need in a release build, there are a lot of empty directories.
            // Remove all of them.
            empty: {
                command: "find build -type d -empty -delete"
            },
            rpmbuild: {
                command: 'rpmbuild --define "_topdir $PWD/build/rpmbuild" ' + 
                            '--define "build_num ' + buildNumber +'" ' +
			    '-ba build/rpmbuild/SPECS/worldview.spec'
            }
        },

        replace: {
            // Add in the timestamp of the build as needed
            timestamp: {
                src: ["build/worldview-debug/web/js/**/*.js"],
                overwrite: true,
                replacements: [{
                    from: "@BUILD_TIMESTAMP@",
                    to: buildTimestamp
                }]
            },
            // Add in the version of this build as needed. Update the version
            // in package.json
            version: {
                src: ["build/worldview-debug/web/js/**/*.js"],
                overwrite: true,
                replacements: [{
                    from: "@BUILD_VERSION@",
                    to: "<%= pkg.version %>"
                }]
            },
            // Add in a timestamp nonce to URIs for cache busting
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
            // Remove all development links <!-- link.dev --> and uncomment
            // all the release links <1-- link.prod -->
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
            },
	    rpm_sources: {
	        src: [
                    "build/rpmbuild/SOURCES/*", 
                    "build/rpmbuild/SPECS/*",
                    "!**/*.tar.gz"
                ],
                overwrite: true,
                replacements: [{
                    from: "@WORLDVIEW@",
                    to: "<%= pkg.name %>"
                },{
		    from: "@BUILD_VERSION@",
                    to: "<%= pkg.version %>"
		},{
                    from: "@BUILD_RELEASE@",
                    to: "<%= pkg.release %>"
                },{
                    from: "@GIT_REVISION@", 
                    to: ".git<%= grunt.config.get('git-revision') %>"
                }]
            }
        },

        concat: {
            // Combine all the Worldview JavaScript files into one file.
            wv_js: {
                src: wvJs,
                dest: "build/worldview-debug/web/js/wv.js"
            },
            // Combine all the Worldview CSS files into one file.
            wv_css: {
                src: wvCss,
                dest: "build/worldview-debug/web/css/wv.css"
            },
            // Combine all the external library JavaScript files into one file.
            ext_js: {
                src: extJs,
                dest: "build/worldview-debug/web/ext/ext.js"
            },
            // Combine all the external library CSS files into one file.
            ext_css: {
                src: extCss,
                dest: "build/worldview-debug/web/ext/ext.css"
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
                        "build/worldview-debug/web/js/wv.js"
                    ]
                }
            },
            // Minifiy the concatenated external libraries JavaScript file.
            ext_js: {
                files: {
                    "build/worldview/web/ext/ext.js": [
                        "build/worldview-debug/web/ext/ext.js"
                    ]
                }
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
                        "build/worldview-debug/web/css/wv.css"
                    ]
                }
            },
            // Minifiy the concatenated external libraries CSS file.
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
            // After removing all the <!-- link.dev --> references, there
            // are a lot of blank lines in index.html. Remove them
            release: {
                files: {
                    "build/worldview/web/index.html":
                        "build/worldview/web/index.html"
                }
            }
        },

        compress: {
            // Create a tarball of the debug build with a version number and
            // git revision.
            debug_versioned: {
                options: {
                    mode: "tgz",
                    archive: "dist/" +
                             "<%= pkg.name %>" +
                             "-debug" +
                             "-<%= pkg.version %>" +
                             "-<%= pkg.release %>" + 
                             ".git<%= grunt.config.get('git-revision') %>" +
                             ".tar.gz"
                },
                files: [{
                    expand: true, cwd: "build/worldview-debug/", src: ["**"],
                    dest: "worldview-debug"
                }]
            },
            // Create a tarball of the debug build without versioning
            // information.
            debug: {
                options: {
                    mode: "tgz",
                    archive: "dist/worldview-debug.tar.gz"
                },
                files: [{
                    expand: true, cwd: "build/worldview-debug/", src: ["**"],
                    dest: "worldview-debug"
                }]
            },
            // Create a tarball of the release build with a version number and
            // git revision.
            release_versioned: {
                options: {
                    mode: "tgz",
                    archive: "dist/" +
                             "<%= pkg.name %>" +
                             "-<%= pkg.version %>" +
                             "-<%= pkg.release %>" +
                             ".git<%= grunt.config.get('git-revision') %>" +
                             ".tar.gz"
                },
                files: [{
                    expand: true, cwd: "build/worldview/", src: ["**"],
                    dest: "worldview"
                }]
            },
            // Create a tarball of the release build without versioning
            // information.
            release: {
                options: {
                    mode: "tgz",
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
            // Removes all JavaScript, CSS, and auxillary files not necessary
            // in a release build. Place exceptions for JavaScript and
            // CSS here.
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
	    dist_tar: ["dist/*.tar.gz"],
	    rpmbuild: ["build/rpmbuild"]
        }

    });

    grunt.file.mkdir("build/rpmbuild");
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
        "copy:config",
        "exec:act",
        "exec:vrt",
        "exec:config",
        "concat",
        "replace:timestamp",
        "replace:nonce",
        "replace:version",
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

    grunt.registerTask("rpm_only", [
        "remove:rpmbuild",
        "copy:rpm_sources",
        "replace:rpm_sources",
        "exec:rpmbuild",
        "copy:rpm"
    ]);

    grunt.registerTask("rpm", ["build", "rpm_only"]);
    grunt.registerTask("clean", "remove:build");
    grunt.registerTask("distclean", ["remove:build", "remove:dist"]);

    grunt.registerTask("default", "build");

};
