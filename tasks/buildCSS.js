#!/usr/bin/env node
const fs = require('fs');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const url = require('postcss-url');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const entryPoint = 'web/css/main.css';
const outputDir = './web/build/';
const outputPath = outputDir + 'wv.css';

fs.readFile(entryPoint, (err, css) => {
  if (err) console.log(err);
  postcss([postcssImport, autoprefixer, cssnano])
    .use(url({
      url: 'copy',
      assetsPath: 'assets/css'
    }))
    .process(css, {
      from: entryPoint,
      to: outputPath,
      map: { inline: false } // Source maps are saved to a file
    })
    .then(result => {
      fs.writeFile(outputPath, result.css, function() {});
      if (result.map) {
        // This allows debugging while still minifying the output in dev
        fs.writeFile(outputPath + '.map', result.map, function() {});
      }
    });
});
