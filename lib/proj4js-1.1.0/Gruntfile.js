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

    var name = "proj4js";
    var version = "1.1.0";
    var base = "wv.proj";

    var lib = "lib/" + name + "-" + version + "/";
    var ext = "src/ext/" + base + "/" + name + "-" + version + "/";
    var debug_js = ext + name + ".js";
    var min_js = ext + name + ".min.js";

    var js = [
        lib + "proj4js.js",
        lib + "merc.js",
        lib + "stere.js",
        lib + "EPSG_3031.js",
        lib + "EPSG_3413.js",
        lib + "EPSG_3995.js",
    ];

    var uglifyFiles = {};
    uglifyFiles[min_js] = [debug_js];

    grunt.initConfig({
        concat: {
            js: {
                src: js,
                dest: debug_js
            },
        },

        uglify: {
            js: {
                files: uglifyFiles
            }
        }
    });

    grunt.file.setBase("../..");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", ["concat", "uglify"]);

};

