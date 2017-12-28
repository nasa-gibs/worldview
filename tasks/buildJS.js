#!/usr/bin/env node
const fs = require('fs');
const browserify = require('browserify');
const watchify = require('watchify');
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const isDebug = process.env.NODE_ENV === 'development';
const isTest = argv.tests;

const entryPoint = isTest ? './test/main.js' : './web/js/main.js';
const outputDir = './web/build/';
const outputPath = outputDir + (isTest ? 'wv-test-bundle.js' : 'wv.js');

var bundler = browserify(entryPoint, {
  debug: isDebug, // Include source maps (makes bundle size larger)
  fullPaths: isDebug, // For use with https://www.npmjs.com/package/disc
  cache: {}, // Required for watchify
  packageCache: {}, // Required for watchify
  plugin: [isDebug ? watchify : null]
}).transform('babelify', {
  presets: ['env']
}).transform('browserify-shim', {
  global: true
}).transform('uglifyify'); // With sourcemaps turned on, it's ok to uglify in dev

function bundle() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  const begin = Date.now();
  var stream = fs.createWriteStream(outputPath);
  bundler.bundle().on('error', function(err) {
    console.error(err);
    this.emit('end');
  }).pipe(stream);
  stream.on('finish', function() {
    console.log('Build complete in ' + (Date.now() - begin) / 1000 + 's');
  });
}

bundle();

bundler.on('update', bundle);
