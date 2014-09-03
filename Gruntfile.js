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

// If being built with Jenkins or Bamboo, include the build number in artifacts
var buildNumber = ( process.env.BUILD_NUMBER )
    ? "." + process.env.BUILD_NUMBER : "";
/* Bamboo build number is not exposed at the moment
if ( !buildNumber ) {
    buildNumber = ( process.env.BAMBOO_BUILDNUMBER )
    ? "." + process.env.BAMBOO_BUILDNUMBER : "";
}
*/

module.exports = function(grunt) {

    var info = grunt.file.readJSON("package.json");

    if ( fs.existsSync("options") ) {
        var opt = grunt.file.readJSON("options/brand.json");
        opt.officialName = opt.officialName || opt.name;
        opt.longName = opt.longName || opt.name;
        opt.shortName = opt.shortName || opt.name;
        opt.packageName = grunt.option("package-name") || opt.packageName;
        var features = grunt.file.readJSON("options/features.json").features;

        console.log("");
        console.log("[" + opt.packageName + "] " + opt.officialName +
                ", Version " + info.version + "-" + info.release);
        console.log("");
    }

    // Lists of JavaScript and CSS files to include and in the correct
    // order
    var wvJs   = grunt.file.readJSON("etc/deploy/wv.js.json");
    var wvCss  = grunt.file.readJSON("etc/deploy/wv.css.json");

    // Copyright notice to place at the top of the minified JavaScript and
    // CSS files
    var banner = grunt.file.read("etc/deploy/banner.txt");

    grunt.initConfig({

        pkg: ( opt ) ? opt.packageName : "",
        info: info,
        opt: opt,
        features: features,

        "git-rev-parse": {
            build: {
                options: {
                    prop: 'git-revision',
                    number: 6
                }
            }
        },

        copy: {
            // Copies the source files to the build directory
            source: {
                files: [
                    { expand: true, cwd: "src",
		              src: ["**", "**/.htaccess"],
                      dest: "build/<%= pkg %>-debug/web" },
                    { expand: true, cwd: "bin",
		              src: "**", dest: "build/<%= pkg %>-debug/bin" },
                    { expand: true, cwd: "options",
                      src: "**", dest: "build/<%= pkg %>-debug/options" }
                ]
            },

            config_src: {
                files: [
                    { expand: true, cwd: "build/options/config",
                      src: ["**"], dest: "src/config" },
                    { expand: true, cwd: "build/options/brand",
                      src: ["**"], dest: "src/brand" }
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
                      src: ["worldview-dev.httpd.conf"], dest: "build" }
                ]
            },

        },

        rename: {
            apache: {
                src: "build/worldview-dev.httpd.conf",
                dest: "dist/<%=pkg%>-dev.httpd.conf"
	    },
	    rpm_apache: {
                src: "build/rpmbuild/SOURCES/httpd.conf",
        	dest: "build/rpmbuild/SOURCES/httpd.<%=pkg%>.conf"
	    },
            rpm_apache_debug: {
		src: "build/rpmbuild/SOURCES/httpd-debug.conf",
                dest: "build/rpmbuild/SOURCES/httpd.<%=pkg%>-debug.conf"
            }
        },

        exec: {
            config: {
                command: "PATH=python/bin:${PATH} bin/wv-options-build"
            },

            // After removing JavaScript and CSS files that are no longer
            // need in a release build, there are a lot of empty directories.
            // Remove all of them.
            empty: {
                command: "find build -type d -empty -delete"
            },

            // Enable executable bits for all CGI programs
            cgi_echo: {
                command: "chmod 755 build/<%=pkg%>*/web/service/*.cgi"
            },

            cgi_shorten: {
                command: "chmod 755 build/<%=pkg%>*/web/service/link/shorten.cgi"
            },

            // Create a tarball of the debug build with a version number and
            // git revision.
            tar_debug_versioned: {
                command: "tar cjCf build dist/<%=pkg%>" +
                            "-debug" +
                            "-<%=info.version%>" +
                            "-<%=info.release%>" +
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
                            "-<%=info.version%>" +
                            "-<%=info.release%>" +
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
                    "build/<%=pkg%>-debug/web/pages/**/*.html",
                    "build/<%=pkg%>-debug/web/brand/**/*.html"
                ],
                overwrite: true,
                replacements: [{
                    from: "@OFFICIAL_NAME@",
                    to: "<%=opt.officialName%>"
                }, {
                    from: "@LONG_NAME@",
                    to: "<%=opt.longName%>"
                },{
                    from: "@NAME@",
                    to: "<%=opt.shortName%>"
                },{
                    from: "@EMAIL@",
                    to: "<%=opt.email%>"
                },{
                    from: "@BUILD_TIMESTAMP@",
                    to: buildTimestamp
                },{
                    from: "@BUILD_VERSION@",
                    to: "<%=info.version%>"
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
                    to: "<%=pkg%>"
                }, {
                    from: "@BUILD_VERSION@",
                    to: "<%=info.version%>"
                },{
                    from: "@BUILD_RELEASE@",
                    to: "<%=info.release%>"
                },{
                    from: "@GIT_REVISION@",
                    to: ".git<%= grunt.config.get('git-revision') %>"
                }]
            },

            apache: {
                src: [
                    "build/worldview-dev.httpd.conf"
                ],
                overwrite: true,
                replacements: [{
                    from: "@WORLDVIEW@",
                    to: "<%=pkg%>"
                },{
                    from: "@ROOT@",
                    to: process.cwd()
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
                    template: "etc/deploy/metadata.template.html"
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
                    template: "etc/deploy/new.template.html"
                }
            }
        },

        concat: {
            // Combine all the Worldview JavaScript files into one file.
            wv_js: {
                src: wvJs["wv.js"],
                dest: "build/<%=pkg%>-debug/web/js/wv.js",
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
            config_src: [
                "src/config/**/*"
            ],
            dist_tar: ["dist/*.tar.bz2"],
            dist_rpm: ["dist/*.rpm"],
            rpmbuild: ["build/rpmbuild"],
            cgi_echo: ["build/<%=pkg%>*/web/service/echo.cgi"],
            cgi_shorten: ["build/<%=pkg%>*/web/service/link/*"]
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
    grunt.loadNpmTasks("grunt-line-remover");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-git-rev-parse");
    grunt.loadNpmTasks("grunt-markdown");
    grunt.loadNpmTasks("grunt-minjson");
    grunt.loadNpmTasks("grunt-text-replace");
    grunt.loadNpmTasks("grunt-rename");

    grunt.renameTask("clean", "remove");
    grunt.task.run("git-rev-parse");

    grunt.registerTask("config", [
        "clean",
        "remove:config_src",
        "exec:config",
        "markdown",
        "copy:config_src"
    ]);

    grunt.registerTask("feature_shorten", "URL Shortening", function() {
        if ( features.urlShortening ) {
            grunt.task.run("exec:cgi_shorten");
        } else {
            grunt.task.run("remove:cgi_shorten");
        }
    });

    grunt.registerTask("feature_download", "Data download", function() {
        if ( features.dataDownload ) {
            grunt.task.run("exec:cgi_echo");
        } else {
            grunt.task.run("remove:cgi_echo");
        }
    });

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
        "feature_shorten",
        "feature_download",
        "remove:dist_tar",
        "exec:tar_debug_versioned",
        "exec:tar_debug",
        "exec:tar_release_versioned",
        "exec:tar_release",
    ]);

    grunt.registerTask("rpm_only", [
        "remove:rpmbuild",
        "copy:rpm_sources",
        "rename:rpm_apache",
        "rename:rpm_apache_debug",
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

    grunt.registerTask("lint", ["jshint:console"]);
    grunt.registerTask("test", ["buster:console"]);
    grunt.registerTask("push", ["lint", "test"]);
    grunt.registerTask("rpm", ["build", "rpm_only"]);
    grunt.registerTask("clean", "remove:build");
    grunt.registerTask("distclean", ["remove:build", "remove:dist"]);

    grunt.registerTask("default", ["build"]);

};
