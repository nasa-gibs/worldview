#!/usr/bin/env node
const fs = require('fs');
const browserify = require('browserify');
const watchify = require('watchify');
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const isProduction = process.env.NODE_ENV === 'production';
const isWatching = process.env.WORLDVIEW_WATCH === 'active';
const isTest = argv.tests;

const entryPoint = isTest ? './test/main.js' : './web/js/main.js';
const outputDir = './web/build/';
const outputPath = outputDir + (isTest ? 'wv-test-bundle.js' : 'wv.js');

// Log what we're building, and in what environment
console.log('Building ' + outputPath + ' for ' + process.env.NODE_ENV);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

var bundler = browserify(entryPoint, {
  debug: !isProduction, // Include source maps (makes bundle size larger)
  fullPaths: !isProduction, // For use with https://www.npmjs.com/package/disc
  cache: {}, // Required for watchify
  packageCache: {}, // Required for watchify
  plugin: [isWatching ? watchify : null]
}).transform('babelify', {
  presets: ['env']
}).transform('browserify-shim', {
  global: true
}).transform('uglifyify'); // With sourcemaps turned on, it's ok to uglify in dev

function bundle() {
  const begin = Date.now();
  var stream = fs.createWriteStream(outputPath);
  bundler.bundle().on('error', function(err) {
    console.error(err);
    this.emit('end');
  }).pipe(stream);
  stream.on('finish', function() {
    console.log(outputPath + ' written in ' + (Date.now() - begin) / 1000 + 's');
  });
}

bundle();

bundler.on('update', bundle);
