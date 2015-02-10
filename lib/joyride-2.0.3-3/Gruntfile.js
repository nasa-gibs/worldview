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

    var name = "joyride";
    var version = "2.0.3-3";
    var base = "tour";

    var lib = "lib/" + name + "-" + version + "/";
    var ext = "web/ext/" + base + "/" + name + "-" + version + "/";
    var debug_js = ext + name + ".js";
    var debug_css = ext + name + ".css";
    var min_js = ext + name + ".min.js";
    var min_css = ext + name + ".min.css";

    var css = [
        lib + "joyride.css"
    ];

    var js = [
        lib + "jquery.cookie.js",
        lib + "jquery.joyride.js",
        lib + "modernizr.mq.js"
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
