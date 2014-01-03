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

module.exports = function(grunt) {

    var name = "mobiscroll";
    var version = "2.6.0";
    var base = "wv.date";

    var lib = "lib/" + name + "-" + version + "/";
    var ext = "src/ext/" + base + "/" + name + "-" + version + "/";
    var debug_js = ext + name + ".js";
    var debug_css = ext + name + ".css";
    var min_js = ext + name + ".min.js";
    var min_css = ext + name + ".min.css";

    var css = [
        lib + "mobiscroll.core.css",
        lib + "mobiscroll.jqm.css",
        lib + "mobiscroll.android.css",
        lib + "mobiscroll.android-ics.css",
        lib + "mobiscroll.ios.css",
        lib + "mobiscroll.sense-ui.css",
        lib + "mobiscroll.wp.css",
        lib + "mobiscroll.animation.css"
    ];

    var js = [
        lib + "mobiscroll.core.js",
        lib + "mobiscroll.datetime.js",
        lib + "mobiscroll.select.js",
        lib + "mobiscroll.jqm.js",
        lib + "mobiscroll.ios.js",
        lib + "mobiscroll.android.js",
        lib + "mobiscroll.android-ics.js",
        lib + "mobiscroll.wp.js"
    ];

    var uglifyFiles = {};
    uglifyFiles[min_js] = [debug_js];

    var cssminFiles = {};
    cssminFiles[min_css] = [debug_css];

    grunt.initConfig({
        concat: {
            js: {
                src: js,
                dest: debug_js
            },
            css: {
                src: css,
                dest: debug_css
            }
        },

        uglify: {
            js: {
                files: uglifyFiles
            }
        },

        cssmin: {
            css: {
                files: cssminFiles
            }
        }
    });

    grunt.file.setBase("../..");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", ["concat", "uglify", "cssmin"]);

};

