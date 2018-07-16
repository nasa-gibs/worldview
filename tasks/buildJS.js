#!/usr/bin/env node
const fs = require('fs');
const browserify = require('browserify');
const watchify = require('watchify');
const minimist = require('minimist');
const uglifyjs = require('uglify-js');

const argv = minimist(process.argv.slice(2));
const isProduction = process.env.NODE_ENV === 'production';
const isWatching = process.env.WORLDVIEW_WATCH === 'active';
const isTest = argv.tests;

const entryPoint = isTest ? './test/main.js' : './web/js/main.js';
const outputDir = './web/build/';
const outputPath = outputDir + (isTest ? 'wv-test-bundle.js' : 'wv.js');

// Log what we're building, and in what environment
let buildEnv = 'development';
if (isProduction) {
  buildEnv = 'production';
}
console.log('Building ' + outputPath + ' for ' + buildEnv);
if (!fs.existsSync(outputDir)) {
  // Bamboo was getting caught up here saying the directory already exists.
  // Just log an error if that happens and continue.
  try {
    fs.mkdirSync(outputDir);
  } catch (err) {
    console.log(err);
  }
}

// bundler is broken up conditionally to allow watch for dev, and uglification for prod
var bundler = browserify(entryPoint, {
  debug: !isProduction, // Include source maps (makes bundle size larger)
  fullPaths: !isProduction, // For use with https://www.npmjs.com/package/disc
  cache: {}, // Required for watchify
  packageCache: {}, // Required for watchify
  plugin: [isWatching ? watchify : null]
});

if (isProduction) {
  bundler = bundler.transform('envify', { // Replace env variables with strings - allows deadcode removal with uglifyify (below) and unglifyjs (see npm script "build:js")
    NODE_ENV: process.env.NODE_ENV,
    global: true
  });
}

bundler = bundler.transform('babelify', { // necessary regardless of dev or prod build
  presets: ['env']
}).transform('browserify-shim', {
  global: true
});

if (isProduction) {
  bundler = bundler.transform('uglifyify', { // With sourcemaps turned on, it's ok to uglify in dev
    global: true
  });
}

function bundle() {
  const begin = Date.now();
  var stream = fs.createWriteStream(outputPath);
  bundler.bundle().on('error', function(err) {
    console.error(err);
    this.emit('end');
  }).pipe(stream);
  stream.on('finish', function() {
    // if production - read bundle file, uglify-js bundle, and rewrite file
    if (isProduction) {
      const uglifyOptions = {
        toplevel: true,
        compress: {
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true
        },
        mangle: true
      };

      fs.readFile(outputPath, 'utf8', function(err, data) {
        if (err) {
          console.log(err);
        }
        var code = uglifyjs.minify(data, uglifyOptions);
        fs.writeFile(outputPath, code.code, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log(outputPath + ' written in ' + (Date.now() - begin) / 1000 + 's');
          }
        });
      });
    } else {
      console.log(outputPath + ' written in ' + (Date.now() - begin) / 1000 + 's');
    }
  });
}

bundle();

bundler.on('update', bundle);
