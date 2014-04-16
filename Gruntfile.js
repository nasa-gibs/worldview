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
var moment = require("moment");
var fs = require("fs");

// Build date shown in the About box
var buildTimestamp = moment.utc().format("MMMM DD, YYYY [-] HH:mm [UTC]");

// Append to all URI references for cache busting
var buildNonce = moment.utc().format("YYYYMMDDHHmmssSSS");

// If being built with Jenkins, include the build number in artifacts
var buildNumber = ( process.env.BUILD_NUMBER )
    ? "." + process.env.BUILD_NUMBER : "";

var files = {};

module.exports = function(grunt) {

    // Lists of JavaScript and CSS files to include and in the correct
    // order
    var wvJs   = grunt.file.readJSON("etc/deploy/wv.js.json");
    var wvCss  = grunt.file.readJSON("etc/deploy/wv.css.json");

    var brand = grunt.option("name") || "example";

    // Copyright notice to place at the top of the minified JavaScript and
    // CSS files
    var banner = grunt.file.read("etc/deploy/banner.txt");

    // Branding and build options
    var opt = {};

    if ( fs.existsSync("options.json") ) {
        opt = grunt.file.readJSON("options.json");

        var bitly = fs.existsSync("conf/bitly_config.py");
        var brandConfig = fs.existsSync("conf/web/brand");
        var gibsOps = !process.env.GIBS_HOST;
        var official = bitly && brandConfig && gibsOps &&
                opt.email === "support@earthdata.nasa.gov";

        console.log();
        console.log("============================================================");
        console.log("[" + opt.packageName + "] " + opt.officialName +
                ", Version " + opt.version + "-" + opt.release);
        console.log("");
        console.log("Branding        : " + brand);
        console.log("Long name       : " + opt.officialName);
        console.log("Short name      : " + opt.shortName);
        console.log("Public GIBS     : " + gibsOps);
        console.log("bit.ly support  : " + bitly);
        console.log("Branding config : " + brandConfig);
        console.log("Support email   : " + opt.email);

        if ( !official ) {
            console.error();
            grunt.log.error("WARNING: This is NOT a standard configuration");
        }
        console.log("============================================================");
        console.log();
    }

    grunt.initConfig({
        pkg: opt.packageName,

        "git-rev-parse": {
            build: {
                options: {
                    prop: 'git-revision',
                    number: 6
                }
            }
        },

        copy: {
            brand: {
                files: [
                    { expand: true, cwd: "etc/brand." + brand,
                      src: ["**"], dest: "." }
                ]
            },

            // Copies the source files to the build directory
            source: {
                files: [
                    { expand: true, cwd: "src",
		              src: ["**", "**/.htaccess"],
                      dest: "build/<%= pkg %>-debug/web" },
                    { expand: true, cwd: "bin",
		              src: "**", dest: "build/<%= pkg %>-debug/bin" },
                    { expand: true, cwd: "conf",
                      src: "**", dest: "build/<%= pkg %>-debug/conf" }
                ]
            },

            // Copies the finished version of the debugging web root to
            // create a release web root. JavaScript and CSS files are omitted
            // since the concatenated version is used instead. Files that
            // must be included in non-concatenated form should be copied
            // over too
            release: {
                files: [
                    { expand: true, cwd: "build/<%=pkg%>-debug",
		      src: ["**", "**/.htaccess"],
                      dest: "build/<%=pkg%>" },
                    { expand: true, cwd: "build/<%=pkg%>-debug/web",
                      src: [
                        "css/pages.css",
                        "css/bulkDownload.css",
                        "js/map/wv.map.tileworker.js"
                      ],
                      dest: "build/<%=pkg%>/web" }
                ]
            },

            // Copies the built tarballs, auxillary files, and spec file
            // to the build directory
            rpm_sources: {
                files: [
                    { expand: true, cwd: "etc/deploy/sources",
                      src: ["**"], dest: "build/rpmbuild/SOURCES" },
                    { expand: true, cwd: "etc/deploy",
                      src: ["worldview.spec"], dest: "build/rpmbuild/SPECS" },
                    { expand: true, cwd: "dist",
                      src: ["<%=pkg%>.tar.bz2", "<%=pkg%>-debug.tar.bz2"],
                      dest: "build/rpmbuild/SOURCES" }
	            ]
            },

            // Copies the built RPMs in the build directory to the dist
            // directory
            rpm: {
                files: [
                    { expand: true, flatten: true, cwd: "build/rpmbuild",
                      src: ["**/*.rpm"], dest: "dist" }
                ]
            },

            apache: {
                files: [
                    { expand: true, flatten: true, cwd: "etc/dev",
                      src: ["worldview-dev.conf"], dest: "build" }
                ]
            },

        },

        rename: {
            apache: {
                src: "build/worldview-dev.conf",
                dest: "dist/<%=pkg%>-dev.conf"
            }
        },

        exec: {
            config: {
                command: "PATH=python/bin:${PATH} bin/make-conf"
            },

            update_gc: {
                command: "bin/fetch-gibs"
            },

            // After removing JavaScript and CSS files that are no longer
            // need in a release build, there are a lot of empty directories.
            // Remove all of them.
            empty: {
                command: "find build -type d -empty -delete"
            },

            // Enable executable bits for all CGI programs
            cgi_echo: {
                command: "chmod 755 build/<%=pkg%>*/web/service/echo.cgi"
            },

            cgi_shorten: {
                command: "chmod 755 build/<%=pkg%>*/web/service/link/shorten.cgi"
            },

            // Create a tarball of the debug build with a version number and
            // git revision.
            tar_debug_versioned: {
                command: "tar cjCf build dist/<%=pkg%>" +
                            "-debug" +
                            "-" + opt.version +
                            "-" + opt.release +
                            buildNumber +
                            ".git<%= grunt.config.get('git-revision') %>" +
                            ".tar.bz2 " +
                            "<%=pkg%>-debug"
            },

            // Create a tarball of the debug build without versioning
            // information
            tar_debug: {
                command: "tar cjCf build dist/" +
                            "<%=pkg%>-debug.tar.bz2 " +
                            "<%=pkg%>-debug"
            },

            // Create a tarball of the release build with a version number and
            // git revision
            tar_release_versioned: {
                command: "tar cjCf build dist/<%=pkg%>" +
                            "-" + opt.version +
                            "-" + opt.release +
                            buildNumber +
                            ".git<%= grunt.config.get('git-revision') %>" +
                            ".tar.bz2 " +
                            "<%=pkg%>"
            },

            // Create a tarball of the release build without versioning
            // information
            tar_release: {
                command: "tar cjCf build dist/" +
                            "<%=pkg%>.tar.bz2 " +
                            "<%=pkg%>"
            },

            // Create a tarball of the documentation with a version number and
            // git revision
            tar_doc_versioned: {
                command: "tar cjCf build dist/<%=pkg%>-doc" +
                            "-" + opt.version +
                            "-" + opt.release +
                            buildNumber +
                            ".git<%= grunt.config.get('git-revision') %>" +
                            ".tar.bz2 <%=pkg%>-doc"
            },

            // Create a tarball of the documentation without versioning
            // information
            tar_doc: {
                command: "tar cjCf build dist/" +
                            "<%=pkg%>-doc.tar.bz2 " +
                            "<%=pkg%>-doc"
            },

            // Builds the RPM
            rpmbuild: {
                command: 'rpmbuild --define "_topdir $PWD/build/rpmbuild" ' +
                            '--define "build_num ' + buildNumber +'" ' +
			    '-ba build/rpmbuild/SPECS/worldview.spec'
            }
        },

        replace: {
            // Official name of the application
            tokens: {
                src: [
                    "build/<%=pkg%>-debug/web/*.html",
                    "build/<%=pkg%>-debug/web/js/**/*.js",
                    "build/<%=pkg%>-debug/web/pages/**/*.html"
                ],
                overwrite: true,
                replacements: [{
                    from: "@OFFICIAL_NAME@",
                    to: opt.officialName
                }, {
                    from: "@LONG_NAME@",
                    to: opt.longName
                },{
                    from: "@NAME@",
                    to: opt.shortName
                },{
                    from: "@EMAIL@",
                    to: opt.email
                },{
                    from: "@BUILD_TIMESTAMP@",
                    to: buildTimestamp
                },{
                    from: "@BUILD_VERSION@",
                    to: opt.version
                },{
                    from: "@BUILD_NONCE@",
                    to: buildNonce
                }]
            },

            // Remove all development links <!-- link.dev --> and uncomment
            // all the release links <1-- link.prod -->
            links: {
                src: [
                   "build/<%=pkg%>-debug/web/index.html",
                   "build/<%=pkg%>-debug/web/pages/*.html",
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

            // Adds RPM package name, version, release, and git revision
            // to the RPM spec file in the build directory
            rpm_sources: {
                src: [
                    "build/rpmbuild/SOURCES/*",
                    "build/rpmbuild/SPECS/*",
                    "!**/*.tar.bz2"
                ],
                overwrite: true,
                replacements: [{
                    from: "@WORLDVIEW@",
                    to: opt.packageName
                }, {
                    from: "@BUILD_VERSION@",
                    to: opt.version
                },{
                    from: "@BUILD_RELEASE@",
                    to: opt.release
                },{
                    from: "@GIT_REVISION@",
                    to: ".git<%= grunt.config.get('git-revision') %>"
                }]
            },

            apache: {
                src: [
                    "build/worldview-dev.conf"
                ],
                overwrite: true,
                replacements: [{
                    from: "@WORLDVIEW@",
                    to: opt.packageName
                },{
                    from: "@ROOT@",
                    to: process.cwd()
                }]
            }
        },

        concat: {
            // Combine all the Worldview JavaScript files into one file.
            wv_js: {
                src: wvJs,
                dest: "build/<%=pkg%>-debug/web/js/wv.js"
            },
            // Combine all the Worldview CSS files into one file.
            wv_css: {
                src: wvCss,
                dest: "build/<%=pkg%>-debug/web/css/wv.css"
            }
        },

        uglify: {
            // Minifiy the concatenated Worldview JavaScript file.
            wv_js: {
                options: {
                    banner: banner
                },
                files: {
                    "build/<%=pkg%>/web/js/wv.js": [
                        "build/<%=pkg%>-debug/web/js/wv.js"
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
                    "build/<%=pkg%>/web/css/wv.css": [
                        "build/<%=pkg%>-debug/web/css/wv.css"
                    ]
                }
            }
        },

        minjson: {
            main: {
                files: {
                    "build/<%=pkg%>/web/conf/wv.json":
                    "build/<%=pkg%>/web/conf/wv.json",
                    "build/<%=pkg%>/web/conf/palettes.json":
                    "build/<%=pkg%>/web/conf/palettes.json"
                }
            }
        },

        lineremover: {
            // After removing all the <!-- link.dev --> references, there
            // are a lot of blank lines in index.html. Remove them
            release: {
                files: {
                    "build/<%=pkg%>/web/index.html":
                        "build/<%=pkg%>/web/index.html"
                }
            }
        },

        yuidoc: {
            main: {
                name: opt.officialName,
                description: opt.description,
                version: opt.version,
                url: opt.url,
                options: {
                    paths: ["src/js"],
                    outdir: "build/<%=pkg%>-doc"
                }
            }
        },

        jshint: {
            console: [
                "src/js/**/wv.*.js",
                "test/**/*.js",
            ],
            report: {
                options: {
                    reporter: "checkstyle",
                },
                files: {
                    src: [
                        "src/js/**/wv.*.js",
                        "test/**/*.js",
                    ]
                }
            }
        },

        csslint: {
            main: {
                options: {
                    ids: false
                },
                src: ["src/css/wv.*.css"]
            }
        },

        buster: {
            console: {},
            report: {
                test: {
                    reporter: "xml"
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
                "build/<%=pkg%>-debug/web/css/**/*.css",
                "build/<%=pkg%>-debug/web/**/*.js",
                "!build/<%=pkg%>-debug/web/css/wv.css",
                "!build/<%=pkg%>-debug/web/js/wv.js",
                "!build/<%=pkg%>-debug/web/css/bulkDownload.css",
                "!build/<%=pkg%>-debug/web/js/map/wv.map.tileworker.js",
                "!build/<%=pkg%>-debug/web/ext/**/*"
            ],
            conf_src: [
                "src/conf/**/*"
            ],
            dist_tar: ["dist/*.tar.bz2"],
            dist_rpm: ["dist/*.rpm"],
            rpmbuild: ["build/rpmbuild"]
        }

    });

    grunt.file.mkdir("build/rpmbuild");
    grunt.file.mkdir("dist");

    grunt.loadNpmTasks("grunt-buster");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-csslint");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-yuidoc");
    grunt.loadNpmTasks("grunt-line-remover");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-git-rev-parse");
    grunt.loadNpmTasks("grunt-minjson");
    grunt.loadNpmTasks("grunt-text-replace");
    grunt.loadNpmTasks("grunt-rename");

    grunt.renameTask("clean", "remove");
    grunt.task.run("git-rev-parse");

    grunt.registerTask("config", [
        "clean",
        "remove:conf_src",
        "exec:update_gc",
        "exec:config"
    ]);

    grunt.registerTask("build", [
        "config",
        "copy:source",
        "concat",
        "replace:tokens",
        "replace:links",
        "remove:source",
        "copy:release",
        "uglify",
        "cssmin",
        "minjson",
        "lineremover",
        "exec:empty",
        "exec:cgi_echo",
        "exec:cgi_shorten",
        "doc",
        "remove:dist_tar",
        "exec:tar_debug_versioned",
        "exec:tar_debug",
        "exec:tar_release_versioned",
        "exec:tar_release",
        "exec:tar_doc_versioned",
        "exec:tar_doc"
    ]);

    grunt.registerTask("rpm_only", [
        "remove:rpmbuild",
        "copy:rpm_sources",
        "replace:rpm_sources",
        "remove:dist_rpm",
        "exec:rpmbuild",
        "copy:rpm"
    ]);

    grunt.registerTask("apache-config" , [
        "copy:apache",
        "replace:apache",
        "rename:apache"
    ]);

    grunt.registerTask("brand", ["copy:brand"]);
    grunt.registerTask("doc", ["yuidoc"]);
    grunt.registerTask("lint", ["jshint:console"]);
    grunt.registerTask("test", ["buster:console"]);
    grunt.registerTask("push", ["lint", "test"]);
    grunt.registerTask("rpm", ["build", "rpm_only"]);
    grunt.registerTask("clean", "remove:build");
    grunt.registerTask("distclean", ["remove:build", "remove:dist"]);

    grunt.registerTask("default", ["build"]);

};
