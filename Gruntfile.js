module.exports = function(grunt) {
    
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    yuidoc: {
        compile: {
            name: "Worldview",
            description: "Description here",
            version: "0.6.0",
            url: "http://earthdata.nasa.gov/labs/worldview",
            options: {
                paths: "src/js",
                outdir: "doc/yuidoc"
            }
        }
    }
  });    
  
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  
  grunt.registerTask("default", ["yuidoc"]);
  
};