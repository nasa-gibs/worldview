#!/usr/bin/env node
const fs = require('fs');
const browserify = require('browserify');
const watchify = require('watchify');

const isDebug = process.env.NODE_ENV === 'development';
const outputDir = './web/build/';
const entryPoint = './web/js/main.js';
const outputPath = outputDir + 'wv.js';

var bundler = browserify(entryPoint, {
  debug: isDebug, // Include source maps (makes bundle size larger)
  fullPaths: isDebug // For use with https://www.npmjs.com/package/disc
  // plugin: [isDebug ? watchify : null]
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
