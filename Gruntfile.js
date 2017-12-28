/* eslint no-template-curly-in-string: "off" */

var fs = require('fs');
var moment = require('moment');
var pkg = require('./package.json');

// Build date shown in the About box
var buildTimestamp = moment.utc().format('MMMM DD, YYYY [-] HH:mm [UTC]');

// Append to all URI references for cache busting
var buildNonce = moment.utc().format('YYYYMMDDHHmmssSSS');
var buildNumber = moment.utc().format('YYMMDDHHmmss');

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean'); // Used to remove build artifacts
  grunt.loadNpmTasks('grunt-contrib-copy'); // Used to move build artifacts around
  grunt.loadNpmTasks('grunt-exec'); // Used to run bash scripts
  grunt.loadNpmTasks('grunt-git-rev-parse'); // Used to get commit hashes
  grunt.loadNpmTasks('grunt-markdown'); // Used to convert md files to html
  grunt.loadNpmTasks('grunt-mkdir'); // Used to make build directories
  grunt.loadNpmTasks('grunt-text-replace'); // Used to replace token strings

  var hasCustomOptions = fs.existsSync('options');
  var optionsPath = hasCustomOptions ? 'options' : 'node_modules/worldview-options-eosdis';

  // Platform specific command for find
  var findCmd;
  if (process.platform === 'win32') {
    findCmd = ';'; // cygwin find doesn't really work in Windows compared to CentOS
  } else {
    findCmd = 'find build -type d -empty -delete';
  }

  grunt.initConfig({

    pkg: pkg,
    optionsPath: optionsPath,
    apache_version: grunt.option('apache-version') || '22',

    copy: {
      apache: {
        src: 'etc/dev/worldview-dev.httpd<%=apache_version%>.conf',
        dest: 'dist/<%=grunt.option("packageName")%>.conf'
      },

      brand_info: {
        files: [
          {
            src: '<%= optionsPath %>/brand.json',
            dest: 'build/options/brand.json'
          }
        ]
      },

      config_src: {
        files: [
          {
            expand: true,
            cwd: 'build/options/config',
            src: ['**'],
            dest: 'web/config'
          }, {
            expand: true,
            cwd: 'build/options/brand',
            src: ['**'],
            dest: 'web/brand'
          }
        ]
      },

      rpm_sources: {
        files: [
          {
            expand: true,
            cwd: 'deploy/sources',
            src: ['**'],
            dest: 'build/rpmbuild/SOURCES'
          }, {
            expand: true,
            cwd: 'deploy',
            src: ['worldview.spec'],
            dest: 'build/rpmbuild/SPECS'
          }, {
            expand: true,
            cwd: 'dist',
            src: [
              'site-<%=grunt.option("packageName")%>.tar.bz2', 'site-<%=grunt.option("packageName")%>-debug.tar.bz2', 'worldview-config.tar.bz2'
            ],
            dest: 'build/rpmbuild/SOURCES'
          }
        ]
      },

      // Copies the source files to the build directory
      source: {
        files: [
          {
            expand: true,
            cwd: '.',
            src: [
              'bin/**',
              'deploy/**',
              'web/**',
              '*',
              'web/**/.htaccess',
              '!node_modules/**',
              '!web/brand/**',
              '!web/config/**',
              '!web/var/**'
            ],
            dest: 'build/worldview-debug'
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
            cwd: 'build/worldview-debug',
            src: [
              '**', '**/.htaccess'
            ],
            dest: 'build/worldview'
          }
        ],
        options: {
          mode: true
        }
      },

      dist_config_versioned: {
        files: [
          {
            src: 'dist/worldview-config.tar.bz2',
            dest: 'dist/worldview-config.git<%= grunt.config.get("config-revision") %>.tar.bz2'
          }
        ]
      },

      dist_site_debug_versioned: {
        files: [
          {
            src: 'dist/site-<%=grunt.option("packageName")%>-debug.tar.bz2',
            dest: 'dist/site-<%=grunt.option("packageName")%>-debug' + '-<%=pkg.version%>' + '-<%=pkg.release%>' + '.tar.bz2'
          }
        ]
      },

      dist_site_release_versioned: {
        files: [
          {
            src: 'dist/site-<%=grunt.option("packageName")%>.tar.bz2',
            dest: 'dist/site-<%=grunt.option("packageName")%>' + '-<%=pkg.version%>' + '-<%=pkg.release%>' + '.tar.bz2'
          }
        ]
      },

      dist_source_debug_versioned: {
        files: [
          {
            src: 'dist/worldview-debug.tar.bz2',
            dest: 'dist/worldview-debug' + '-<%=pkg.version%>' + '-<%=pkg.release%>' + '.git<%= grunt.config.get("source-revision") %>' + '.tar.bz2'
          }
        ]
      },

      dist_source_release_versioned: {
        files: [
          {
            src: 'dist/worldview.tar.bz2',
            dest: 'dist/worldview' + '-<%=pkg.version%>' + '-<%=pkg.release%>' + '.git<%= grunt.config.get("source-revision") %>' + '.tar.bz2'
          }
        ]
      },

      rpm: {
        files: [
          {
            expand: true,
            flatten: true,
            cwd: 'build/rpmbuild',
            src: ['**/*.rpm'],
            dest: 'dist'
          }
        ]
      },

      site: {
        files: [
          {
            expand: true,
            cwd: 'build/worldview-debug',
            src: [
              'web/**', 'web/**/.htaccess'
            ],
            dest: 'build/site-<%=grunt.option("packageName")%>-debug'
          }, {
            expand: true,
            cwd: 'build/options',
            src: ['**'],
            dest: 'build/site-<%=grunt.option("packageName")%>-debug/web'
          }, {
            src: 'options/bitly.json',
            dest: 'build/site-<%=grunt.option("packageName")%>-debug/etc/bitly.json'
          }, {
            expand: true,
            cwd: 'build/worldview',
            src: [
              'web/**', 'web/**/.htaccess'
            ],
            dest: 'build/site-<%=grunt.option("packageName")%>'
          }, {
            expand: true,
            cwd: 'build/options',
            src: ['**'],
            dest: 'build/site-<%=grunt.option("packageName")%>/web'
          }, {
            src: 'options/bitly.json',
            dest: 'build/site-<%=grunt.option("packageName")%>/etc/bitly.json'
          }
        ],
        options: {
          mode: true
        }
      }
    },

    exec: {

      // After removing JavaScript and CSS files that are no longer
      // need in a release build, there are a lot of empty directories.
      // Remove all of them.
      empty: {
        command: findCmd
      },

      rpmbuild: {
        command: 'rpmbuild --define "_topdir $PWD/build/rpmbuild" ' + '-ba build/rpmbuild/SPECS/worldview.spec'
      },

      tar_config: {
        command: 'tar -C build -cjf dist/worldview-config.tar.bz2 ' + 'options'
      },

      tar_site_debug: {
        command: 'tar cjCf build dist/site-<%=grunt.option("packageName")%>-debug.tar.bz2 ' + 'site-<%=grunt.option("packageName")%>-debug'
      },

      tar_site_release: {
        command: 'tar cjCf build dist/site-<%=grunt.option("packageName")%>.tar.bz2 ' + 'site-<%=grunt.option("packageName")%>'
      },

      tar_source_debug: {
        command: 'tar cjCf build dist/worldview-debug.tar.bz2 ' + 'worldview-debug'
      },

      tar_source_release: {
        command: 'tar cjCf build dist/worldview.tar.bz2 ' + 'worldview'
      }
    },

    'git-rev-parse': {
      source: {
        options: {
          prop: 'source-revision',
          number: 6
        }
      },
      config: {
        options: {
          prop: 'config-revision',
          cwd: '<%= optionsPath %>',
          number: 6
        }
      }
    },

    markdown: {
      metadata: {
        files: [
          {
            expand: true,
            cwd: 'build/options/config/metadata',
            src: '**/*.md',
            dest: 'build/options/config/metadata',
            ext: '.html'
          }
        ],
        options: {
          template: 'deploy/metadata.template.html'
        }
      },
      new: {
        files: [
          {
            expand: true,
            cwd: 'build/options/brand/pages',
            src: '**/*.md',
            dest: 'build/options/brand/pages',
            ext: '.html'
          }
        ],
        options: {
          template: 'deploy/new.template.html'
        }
      }
    },

    mkdir: {
      dist: {
        options: {
          create: ['dist']
        }
      },
      rpmbuild: {
        options: {
          create: ['build/rpmbuild']
        }
      }
    },

    clean: {
      build: ['build'],
      dist: ['dist'],
      // Removes all JavaScript, CSS, and auxillary files not necessary
      // in a release build. Place exceptions for JavaScript and
      // CSS here.
      source: [
        'build/worldview-debug/web/css/**/*.css',
        'build/worldview-debug/web/**/*.js',
        '!build/worldview-debug/web/css/wv.css',
        '!build/worldview-debug/web/js/wv.js',
        '!build/worldview-debug/web/js/ol.js',
        '!build/worldview-debug/web/css/bulkDownload.css',
        '!build/worldview-debug/web/ext/**/*',
        '!build/worldview-debug/web/build/**/*'
      ],
      config_src: ['web/config/**/*'],
      build_source: [
        'build/worldview', 'build/worldview-debug'
      ],
      build_config: [
        'build/options', 'build/options-build'
      ],
      build_site: [
        'build/site-<%=grunt.option("packageName")%>-debug', 'build/site-<%=grunt.option("packageName")%>'
      ],
      dist_rpm: ['dist/*.rpm'],
      rpmbuild: ['build/rpmbuild']
    },

    replace: {
      apache: {
        src: ['dist/<%=grunt.option("packageName")%>.conf'],
        overwrite: true,
        replacements: [
          {
            from: '@WORLDVIEW@',
            to: '<%=grunt.option("packageName")%>'
          }, {
            from: '@ROOT@',
            to: process.cwd()
          }
        ]
      },

      rpm_sources: {
        src: [
          'build/rpmbuild/SOURCES/*', 'build/rpmbuild/SPECS/*', '!**/*.tar.bz2'
        ],
        overwrite: true,
        replacements: [
          {
            from: '@WORLDVIEW@',
            to: '<%=grunt.option("packageName")%>'
          }, {
            from: '@BUILD_VERSION@',
            to: '<%=pkg.version%>'
          }, {
            from: '@BUILD_RELEASE@',
            to: '<%=pkg.release%>'
          }, {
            from: '@BUILD_NUMBER@',
            to: buildNumber
          }
        ]
      },

      tokens: {
        src: [
          'build/site-<%=grunt.option("packageName")%>-debug/**/*.html', 'build/site-<%=grunt.option("packageName")%>-debug/**/*.js', 'build/site-<%=grunt.option("packageName")%>/**/*.html', 'build/site-<%=grunt.option("packageName")%>/**/*.js'
        ],
        overwrite: true,
        replacements: [
          {
            from: '@OFFICIAL_NAME@',
            to: '<%=grunt.option("officialName")%>'
          }, {
            from: '@LONG_NAME@',
            to: '<%=grunt.option("longName")%>'
          }, {
            from: '@NAME@',
            to: '<%=grunt.option("shortName")%>'
          }, {
            from: '@MAIL@',
            to: '<%=grunt.option("email")%>'
          }, {
            from: '@BUILD_TIMESTAMP@',
            to: buildTimestamp
          }, {
            from: '@BUILD_VERSION@',
            to: '<%=pkg.version%>'
          }, {
            from: '@BUILD_NONCE@',
            to: buildNonce
          }
        ]
      }
    }

  });

  grunt.registerTask('load_branding', 'Load branding', function () {
    var brand = grunt.file.readJSON('build/options/brand.json');
    brand.officialName = brand.officialName || brand.name;
    brand.longName = brand.longName || brand.name;
    brand.shortName = brand.shortName || brand.name;
    brand.packageName = grunt.option('package-name') || brand.packageName;
    brand.email = brand.email || 'support@example.com';

    grunt.option('officialName', brand.officialName);
    grunt.option('longName', brand.longName);
    grunt.option('shortName', brand.shortName);
    grunt.option('packageName', brand.packageName);
    grunt.option('email', brand.email);
  });

  grunt.registerTask('build', [
    'clean:build_source', // Clear some directories
    'git-rev-parse:source', // Get commit hash
    'copy:source', // Copy source files into build/worldview-debug
    'clean:source', // Removes unneccesary assets from build directory
    'exec:empty', // Delete empty directories in the build
    'copy:release', // Copy build/worldview-debug into build/worldview
    'mkdir:dist', // Make dist directory
    'exec:tar_source_debug', // Make worldview-debug tar from /build
    'copy:dist_source_debug_versioned', // Add version number and hash to copy of tar
    'exec:tar_source_release', // Make worldview-debug tar from /build
    'copy:dist_source_release_versioned' // Add version number and hash to copy of tar
  ]);

  grunt.registerTask('config', [
    'git-rev-parse:config', // Get commit hash
    'markdown', // Parse metadata and pages md files into html
    'copy:config_src', // Copy build results to web/config and web/brand
    'copy:brand_info', // Copy brand config file to build directory
    'mkdir:dist', // Make dist directory
    'exec:tar_config', // Create worldview-config tar from options directory
    'copy:dist_config_versioned' // Create copy of tar with version number
  ]);

  grunt.registerTask('site', [
    'load_branding', // Set grunt variables from built options file
    'clean:build_site', // Remove some build directories
    'copy:site', // Copy /worldview and /worldview-config builds to /build/site
    'replace:tokens', // Replace string placeholders in JS and HTML (no CSS)
    'exec:tar_site_debug', // Create debug tar
    'copy:dist_site_debug_versioned', // Create debug tar with version number
    'exec:tar_site_release', // Create release tar
    'copy:dist_site_release_versioned' // Create release tar with version number
  ]);

  grunt.registerTask('rpm-only', [
    'load_branding', // Set grunt variables from built options file
    'git-rev-parse:source', // Get commit hash
    'clean:rpmbuild', // Remove build/rpmbuild directory
    'mkdir:rpmbuild', // Create build/rpmbuild directory
    'copy:rpm_sources', // Copy sources needed to build/rpmbuild
    'replace:rpm_sources', // Replace name, version, release and build numbers in rpm
    'clean:dist_rpm', // Remove any existing .rpm files
    'exec:rpmbuild', // Run the command to build the rpm
    'copy:rpm' // Copy rpm files to /dist
  ]);

  // Set grunt variables, move .conf file to /dist and replace @WORLDVIEW@ and @ROOT@
  grunt.registerTask('apache-config', ['load_branding', 'copy:apache', 'replace:apache']);

  grunt.registerTask('default', [
    'build', // Copy assets to build directories and generate tar files
    'config', // Build options artifacts and put them in build, dist, web
    'site' // Combine /build/worldview and /build/options to create final build
  ]);
};
