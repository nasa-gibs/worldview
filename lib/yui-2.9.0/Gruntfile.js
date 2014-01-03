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

    var name = "yui";
    var version = "2.9.0";
    var base = "wv.ui";

    var lib = "lib/" + name + "-" + version + "/";
    var ext = "src/ext/" + base + "/" + name + "-" + version + "/";
    var debug_js = ext + name + ".js";
    var debug_css = ext + name + ".css";
    var min_js = ext + name + ".min.js";
    var min_css = ext + name + ".min.css";

    var css = [
        lib + "combo-container-min.css"
    ];

    var js = [
        lib + "yahoo/yahoo.js",
        lib + "event/event.js",
        lib + "dom/dom.js",
        lib + "dragdrop/dragdrop.js",
        lib + "yahoo-dom-event/yahoo-dom-event.js",
        lib + "animation/animation.js",
        lib + "connection/connection.js",
        lib + "element/element.js",
        lib + "button/button.js",
        lib + "container/container.js",
        lib + "storage/storage.js"
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

