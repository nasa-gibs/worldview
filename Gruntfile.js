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

var fs = require("fs");
var moment = require("moment");
var nodeModuleFiles = [
  "node_modules/babel-polyfill/dist/polyfill.js",
  "node_modules/babel-polyfill/dist/polyfill.min.js",
  "node_modules/svg4everybody/dist/svg4everybody.js",
  "node_modules/svg4everybody/dist/svg4everybody.min.js",
  "node_modules/react/dist/react.js",
  "node_modules/react/dist/react.min.js",
  "node_modules/react-dom/dist/react-dom.js",
  "node_modules/react-dom/dist/react-dom.min.js",
  "node_modules/worldview-components/browser/wvc.js",
  "node_modules/worldview-components/browser/wvc.min.js",
  "node_modules/lodash/lodash.js",
  "node_modules/lodash/lodash.min.js",
  "node_modules/bluebird/js/browser/bluebird.js",
  "node_modules/bluebird/js/browser/bluebird.min.js",
  "node_modules/gifshot/build/custom/gifshot.custom.js",
  "node_modules/gifshot/build/custom/gifshot.custom.min.js",
  "node_modules/promise-queue/lib/index.js",
  "node_modules/openlayers/dist/ol-debug.js",
  "node_modules/openlayers/dist/ol.js",
  "node_modules/openlayers/dist/ol.css",
  "node_modules/font-awesome/css/font-awesome.min.css",
  "node_modules/font-awesome/fonts/*",
  "node_modules/clipboard/dist/clipboard.js",
  "node_modules/clipboard/dist/clipboard.min.js"
];

// Build date shown in the About box
var buildTimestamp = moment.utc().format("MMMM DD, YYYY [-] HH:mm [UTC]");

// Append to all URI references for cache busting
var buildNonce = moment.utc().format("YYYYMMDDHHmmssSSS");
var buildNumber = moment.utc().format("YYMMDDHHmmss");

module.exports = function(grunt) {

  var env = grunt.option("env") || "release";

  var options = {
    version: 0,
    release: 0
  };

  var pkg = grunt.file.readJSON("package.json");

  if (fs.existsSync("options/version.json")) {
    options = grunt.file.readJSON("options/version.json");
  }

  // Lists of JavaScript and CSS files to include and in the correct
  // order
  var js = grunt.file.readJSON("deploy/wv.js.json");
  var css = grunt.file.readJSON("deploy/wv.css.json");

  // Copyright notice to place at the top of the minified JavaScript and
  // CSS files
  var banner = grunt.file.read("deploy/banner.txt");

  //Platform specific command for find
  var findCmd;
  if (process.platform === 'win32')
    findCmd = ";"; //cygwin find doesn't really work in Windows compared to CentOS
  else
    findCmd = "find build -type d -empty -delete";

  // Platform specific location for Python
  var pythonPath;
  if (process.platform === 'win32') {
    pythonPath = "python/Scripts";
  } else {
    pythonPath = "python/bin";
  }

  grunt.initConfig({

    pkg: pkg,
    opt: options,
    apache_version: grunt.option("apache-version") || "22",

    postcss: {
      stylelint: {
        options: {
          map: false,
          processors: [require('stylelint')({
            configFile: '.stylelintrc',
            formatter: 'string',
            ignoreDisables: false,
            failOnError: true,
            outputFile: '',
            reportNeedlessDisables: false,
            syntax: ''
          })]
        },
        src: 'web/css/*.css'
      },
      autoprefix: {
        options: {
          map: false,
          processors: [require('autoprefixer')]
        },
        src: 'web/css/*.css'
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

    concat: {
      // Combine all the Worldview JavaScript files into one file.
      js: {
        src: js["wv.js"],
        dest: "build/worldview-debug/web/js/wv.js"
      },
      // Combine all the Openlayers JavaScript files into one file.
      oljs: {
        src: js["ol.js"],
        dest: "build/worldview-debug/web/js/ol.js"
      },
      // Combine all the Worldview CSS files into one file.
      css: {
        src: css,
        dest: "build/worldview-debug/web/css/wv.css"
      }
    },

    copy: {
      apache: {
        src: "etc/dev/worldview-dev.httpd<%=apache_version%>.conf",
        dest: "dist/<%=grunt.option('packageName')%>.conf"
      },

      brand_info: {
        files: [
          {
            src: "options/brand.json",
            dest: "build/options/brand.json"
          }
        ]
      },

      config_src: {
        files: [
          {
            expand: true,
            cwd: "build/options/config",
            src: ["**"],
            dest: "web/config"
          }, {
            expand: true,
            cwd: "build/options/brand",
            src: ["**"],
            dest: "web/brand"
          }
        ]
      },

      rpm_sources: {
        files: [
          {
            expand: true,
            cwd: "deploy/sources",
            src: ["**"],
            dest: "build/rpmbuild/SOURCES"
          }, {
            expand: true,
            cwd: "deploy",
            src: ["worldview.spec"],
            dest: "build/rpmbuild/SPECS"
          }, {
            expand: true,
            cwd: "dist",
            src: [
              "site-<%=grunt.option('packageName')%>.tar.bz2", "site-<%=grunt.option('packageName')%>-debug.tar.bz2", "worldview-config.tar.bz2"
            ],
            dest: "build/rpmbuild/SOURCES"
          }
        ]
      },

      // Copies the source files to the build directory
      source: {
        files: [
          {
            expand: true,
            cwd: ".",
            src: [
              "bin/**",
              "deploy/**",
              "web/**",
              "*",
              "web/**/.htaccess",
              "!node_modules/**",
              "!web/brand/**",
              "!web/config/**",
              "!web/var/**"
            ],
            dest: "build/worldview-debug"
          }
        ],
        options: {
          mode: true
        }
      },

      ext: {
        files: [
          {
            expand: true,
            cwd: ".",
            overwrite: true,
            src: nodeModuleFiles,
            dest: "web/ext"
          }
        ],
        options: {
          mode: true
        }
      },

      release: {
        files: [
          {
            expand: true,
            cwd: "build/worldview-debug",
            src: [
              "**", "**/.htaccess"
            ],
            dest: "build/worldview"
          }
        ],
        options: {
          mode: true
        }
      },

      dist_config_versioned: {
        files: [
          {
            src: "dist/worldview-config.tar.bz2",
            dest: "dist/worldview-config" + "-<%=opt.version%>" + "-<%=opt.release%>" + ".git<%= grunt.config.get('config-revision') %>" + ".tar.bz2"
          }
        ]
      },

      dist_site_debug_versioned: {
        files: [
          {
            src: "dist/site-<%=grunt.option('packageName')%>-debug.tar.bz2",
            dest: "dist/site-<%=grunt.option('packageName')%>-debug" + "-<%=pkg.version%>" + "-<%=pkg.release%>" + ".tar.bz2"
          }
        ]
      },

      dist_site_release_versioned: {
        files: [
          {
            src: "dist/site-<%=grunt.option('packageName')%>.tar.bz2",
            dest: "dist/site-<%=grunt.option('packageName')%>" + "-<%=pkg.version%>" + "-<%=pkg.release%>" + ".tar.bz2"
          }
        ]
      },

      dist_source_debug_versioned: {
        files: [
          {
            src: "dist/worldview-debug.tar.bz2",
            dest: "dist/worldview-debug" + "-<%=pkg.version%>" + "-<%=pkg.release%>" + ".git<%= grunt.config.get('source-revision') %>" + ".tar.bz2"
          }
        ]
      },

      dist_source_release_versioned: {
        files: [
          {
            src: "dist/worldview.tar.bz2",
            dest: "dist/worldview" + "-<%=pkg.version%>" + "-<%=pkg.release%>" + ".git<%= grunt.config.get('source-revision') %>" + ".tar.bz2"
          }
        ]
      },

      rpm: {
        files: [
          {
            expand: true,
            flatten: true,
            cwd: "build/rpmbuild",
            src: ["**/*.rpm"],
            dest: "dist"
          }
        ]
      },

      site: {
        files: [
          {
            expand: true,
            cwd: "build/worldview-debug",
            src: [
              "web/**", "web/**/.htaccess"
            ],
            dest: "build/site-<%=grunt.option('packageName')%>-debug"
          }, {
            expand: true,
            cwd: "build/options",
            src: ["**"],
            dest: "build/site-<%=grunt.option('packageName')%>-debug/web"
          }, {
            src: "options/bitly.json",
            dest: "build/site-<%=grunt.option('packageName')%>-debug/etc/bitly.json"
          }, {
            expand: true,
            cwd: "build/worldview",
            src: [
              "web/**", "web/**/.htaccess"
            ],
            dest: "build/site-<%=grunt.option('packageName')%>"
          }, {
            expand: true,
            cwd: "build/options",
            src: ["**"],
            dest: "build/site-<%=grunt.option('packageName')%>/web"
          }, {
            src: "options/bitly.json",
            dest: "build/site-<%=grunt.option('packageName')%>/etc/bitly.json"
          }
        ],
        options: {
          mode: true
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
          "build/worldview/web/css/wv.css": ["build/worldview/web/css/wv.css"]
        }
      }
    },

    eslint: {
      options: {
        configFile: ".eslintrc",
        format: "stylish"
      },
      src: ["web/js/**/wv.*.js", "test/**/*.js"]
    },

    exec: {
      config: {
        command: "bash -c \"PATH=" + pythonPath + ":\"${PATH}\" bin/wv-options-build \"" + env
      },

      // After removing JavaScript and CSS files that are no longer
      // need in a release build, there are a lot of empty directories.
      // Remove all of them.
      empty: {
        command: findCmd
      },

      fetch: {
        command: "bash -c \"PATH=" + pythonPath + ":\"${PATH}\" FETCH_GC=1 bin/wv-options-build \"" + env
      },
      node_packages: {
        command: 'npm update'
      },

      python_packages: {
        command: 'virtualenv python && bash -c \"PATH=' + pythonPath + ':${PATH} pip install xmltodict isodate\"'
      },

      rpmbuild: {
        command: 'rpmbuild --define "_topdir $PWD/build/rpmbuild" ' + '-ba build/rpmbuild/SPECS/worldview.spec'
      },

      tar_config: {
        command: "tar -C build -cjf dist/worldview-config.tar.bz2 " + "options"
      },

      tar_site_debug: {
        command: "tar cjCf build dist/site-<%=grunt.option('packageName')%>-debug.tar.bz2 " + "site-<%=grunt.option('packageName')%>-debug"
      },

      tar_site_release: {
        command: "tar cjCf build dist/site-<%=grunt.option('packageName')%>.tar.bz2 " + "site-<%=grunt.option('packageName')%>"
      },

      tar_source_debug: {
        command: "tar cjCf build dist/worldview-debug.tar.bz2 " + "worldview-debug"
      },

      tar_source_release: {
        command: "tar cjCf build dist/worldview.tar.bz2 " + "worldview"
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
        files: [
          {
            expand: true,
            cwd: "build",
            src: ["**/web/**/*.html"],
            dest: "build"
          }
        ]
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
          }
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
      },
      rpmbuild: {
        options: {
          create: ["build/rpmbuild"]
        }
      }
    },

    nightwatch: {
      options: {
        // task options
        src_folders: ["./e2e/tests"],
        standalone: true,
        // download settings
        jar_version: '3.0.1',
        globals_path: "./e2e/globals.js",
        selenium_port: 4444,
        server_path: "node_modules/selenium-server-standalone-jar/jar/selenium-server-standalone-3.0.1.jar",
        test_settings: {
          firefox: {
            "desiredCapabilities": {
              "browserName": "firefox",
              // "marionette": false, - Windows users
              "marionette": true,
              "javascriptEnabled": true
            },
            "cli_args": {
              "webdriver.gecko.driver": "node_modules/geckodriver/bin/geckodriver"
            }
          },
          chrome: {
            "desiredCapabilities": {
              "browserName": "chrome"
            },
            "cli_args": {
              // "webdriver.chrome.driver" : "node_modules/chromedriver/lib/chromedriver/chromedriver.exe" - Windows users
              "webdriver.chrome.driver": "node_modules/chromedriver/lib/chromedriver/chromedriver"
            }
          }
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
        "!build/worldview-debug/web/js/ol.js",
        "!build/worldview-debug/web/css/bulkDownload.css",
        "!build/worldview-debug/web/ext/**/*"
      ],
      modules: ["web/ext/node_modules/**"],
      config_src: ["web/config/**/*"],
      build_source: [
        "build/worldview", "build/worldview-debug"
      ],
      build_config: [
        "build/options", "build/options-build"
      ],
      build_site: [
        "build/site-<%=grunt.option('packageName')%>-debug", "build/site-<%=grunt.option('packageName')%>"
      ],
      dist_rpm: ["dist/*.rpm"],
      rpmbuild: ["build/rpmbuild"]
    },

    replace: {
      apache: {
        src: ["dist/<%=grunt.option('packageName')%>.conf"],
        overwrite: true,
        replacements: [
          {
            from: "@WORLDVIEW@",
            to: "<%=grunt.option('packageName')%>"
          }, {
            from: "@ROOT@",
            to: process.cwd()
          }
        ]
      },

      // Remove all development links <!-- link.dev --> and uncomment
      // all the release links <!-- link.prod -->
      links: {
        src: [
          "build/**/web/index.html", "build/**/web/pages/*.html"
        ],
        overwrite: true,
        replacements: [
          {
            from: /.*link.dev.*/g,
            to: ""
          }, {
            from: /.*link.prod.*(!--|\/\*)(.*)(--|\*\/).*/g,
            to: "$2"
          }
        ]
      },

      rpm_sources: {
        src: [
          "build/rpmbuild/SOURCES/*", "build/rpmbuild/SPECS/*", "!**/*.tar.bz2"
        ],
        overwrite: true,
        replacements: [
          {
            from: "@WORLDVIEW@",
            to: "<%=grunt.option('packageName')%>"
          }, {
            from: "@BUILD_VERSION@",
            to: "<%=pkg.version%>"
          }, {
            from: "@BUILD_RELEASE@",
            to: "<%=pkg.release%>"
          }, {
            from: "@BUILD_NUMBER@",
            to: buildNumber
          }
        ]
      },

      tokens: {
        src: [
          "build/site-<%=grunt.option('packageName')%>-debug/**/*.html", "build/site-<%=grunt.option('packageName')%>-debug/**/*.js", "build/site-<%=grunt.option('packageName')%>/**/*.html", "build/site-<%=grunt.option('packageName')%>/**/*.js"
        ],
        overwrite: true,
        replacements: [
          {
            from: "@OFFICIAL_NAME@",
            to: "<%=grunt.option('officialName')%>"
          }, {
            from: "@LONG_NAME@",
            to: "<%=grunt.option('longName')%>"
          }, {
            from: "@NAME@",
            to: "<%=grunt.option('shortName')%>"
          }, {
            from: "@MAIL@",
            to: "<%=grunt.option('email')%>"
          }, {
            from: "@BUILD_TIMESTAMP@",
            to: buildTimestamp
          }, {
            from: "@BUILD_VERSION@",
            to: "<%=pkg.version%>"
          }, {
            from: "@BUILD_NONCE@",
            to: buildNonce
          }
        ]
      }
    },

    stylefmt: {
      format: {
        files:[
          {
            expand: true,
            src: 'web/css/*.css',
            dest: './'
          }
        ]
      },
    },

    watch: {
      scripts: {
        files: nodeModuleFiles,
        tasks: ['update']
      }
    },

    uglify: {
      // Minifiy the concatenated Worldview JavaScript file.
      options: {
        banner: banner,
        compress: {
          //drop_console: true,
          //drop_debugger: true,
          unused: true
        }
      },
      wv_js: {
        files: {
          "build/worldview/web/js/wv.js": ["build/worldview/web/js/wv.js"]
        }
      },
      ol_js: {
        files: {
          "build/worldview/web/js/ol.js": ["build/worldview/web/js/ol.js"]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-buster");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("gruntify-eslint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks("grunt-line-remover");
  grunt.loadNpmTasks("grunt-exec");
  grunt.loadNpmTasks("grunt-git-rev-parse");
  grunt.loadNpmTasks("grunt-markdown");
  grunt.loadNpmTasks("grunt-minjson");
  grunt.loadNpmTasks("grunt-mkdir");
  grunt.loadNpmTasks("grunt-postcss");
  grunt.loadNpmTasks("grunt-stylefmt");
  grunt.loadNpmTasks("grunt-text-replace");
  grunt.loadNpmTasks("grunt-rename");
  grunt.loadNpmTasks("grunt-nightwatch");

  // Lets use "clean" as a target instead of the name of the task
  grunt.renameTask("clean", "remove");

  grunt.registerTask("load_branding", "Load branding", function() {
    var brand = grunt.file.readJSON("build/options/brand.json");
    brand.officialName = brand.officialName || brand.name;
    brand.longName = brand.longName || brand.name;
    brand.shortName = brand.shortName || brand.name;
    brand.packageName = grunt.option("package-name") || brand.packageName;
    brand.email = brand.email || "support@example.com";

    console.log("\n=========================================================");
    console.log("[" + brand.packageName + "] " + brand.officialName + ", Version " + pkg.version + "-" + pkg.release);
    console.log("=========================================================");

    grunt.option("officialName", brand.officialName);
    grunt.option("longName", brand.longName);
    grunt.option("shortName", brand.shortName);
    grunt.option("packageName", brand.packageName);
    grunt.option("email", brand.email);
  });

  grunt.registerTask("autoprefix", ["postcss:autoprefix"]);

  grunt.registerTask("build", [
    "remove:build_source",
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
    "mkdir:dist",
    "exec:tar_source_debug",
    "copy:dist_source_debug_versioned",
    "exec:tar_source_release",
    "copy:dist_source_release_versioned"
  ]);

  grunt.registerTask("config", [
    "remove:build_config",
    "git-rev-parse:config",
    "remove:config_src",
    "exec:config",
    "markdown",
    "copy:config_src",
    "copy:brand_info",
    "mkdir:dist",
    "exec:tar_config",
    "copy:dist_config_versioned"
  ]);

  grunt.registerTask("fetch", ["exec:fetch"]);

  grunt.registerTask("site", [
    "load_branding",
    "remove:build_site",
    "copy:site",
    "replace:tokens",
    "exec:tar_site_debug",
    "copy:dist_site_debug_versioned",
    "exec:tar_site_release",
    "copy:dist_site_release_versioned"
  ]);

  grunt.registerTask("stylelint", ["postcss:stylelint"]);

  grunt.registerTask("rpm-only", [
    "load_branding",
    "git-rev-parse:source",
    "remove:rpmbuild",
    "mkdir:rpmbuild",
    "copy:rpm_sources",
    "replace:rpm_sources",
    "remove:dist_rpm",
    "exec:rpmbuild",
    "copy:rpm"
  ]);

  grunt.registerTask("apache-config", ["load_branding", "copy:apache", "replace:apache"]);

  grunt.registerTask("update", ["remove:modules", "copy:ext"]);
  grunt.registerTask("update-packages", ["exec:python_packages", "exec:node_packages", "update"]);
  grunt.registerTask("check", ["lint", "test"]);
  grunt.registerTask("clean", ["remove:build"]);
  grunt.registerTask("distclean", ["remove:build", "remove:dist"]);
  grunt.registerTask("lint", ["eslint"], ["stylelint"]);
  grunt.registerTask("test", ["buster:console"]);
  grunt.registerTask("chrome-tests", ["nightwatch:chrome"]);
  grunt.registerTask("firefox-tests", ["nightwatch:firefox"]);
  grunt.registerTask("e2e", ["firefox-tests", "chrome-tests"]);

  grunt.registerTask("default", [
    "update-packages",
    "fetch",
    "update",
    "build",
    "config",
    "site"
  ]);
};
