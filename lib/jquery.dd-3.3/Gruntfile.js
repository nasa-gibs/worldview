module.exports = function(grunt) {

    var name = "jquery.dd";
    var version = "3.3";
    var base = "wv.palette";

    var lib = "lib/" + name + "-" + version + "/";
    var ext = "src/ext/" + base + "/" + name + "-" + version + "/";
    var debug_js = ext + name + ".js";
    var debug_css = ext + name + ".css";
    var min_js = ext + name + ".min.js";
    var min_css = ext + name + ".min.css";

    var css = [
        lib + "dd.css",
        lib + "skin2.css"
    ];

    var js = [
        lib + "jquery.dd.js",
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
