module.exports = function(grunt) {

    var name = "jquery.jscrollpane";
    var version = "2.0.17";
    var base = "wv.ui";

    var lib = "lib/" + name + "-" + version + "/";
    var ext = "src/ext/" + base + "/" + name + "-" + version + "/";
    var debug_js = ext + name + ".js";
    var min_js = ext + name + ".min.js";

    var js = [
        lib + "jquery.mousewheel.js",
        lib + "mwheelIntent.js",
        lib + "jquery.jscrollpane.js",
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
