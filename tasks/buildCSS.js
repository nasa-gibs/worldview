#!/usr/bin/env node
const fs = require('fs');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const url = require('postcss-url');
const autoprefixer = require('autoprefixer');
const stylelint = require('stylelint');
const cssnano = require('cssnano');

fs.readFile('web/css/main.css', (err, css) => {
  if (err) console.log(err);
  postcss([postcssImport, autoprefixer, stylelint, cssnano])
    .use(url({
      url: 'copy',
      assetsPath: 'assets/css'
    }))
    .process(css, {
      from: 'web/css/main.css',
      to: 'web/build/wv.css',
      map: { inline: false } // Source maps are saved to a file
    })
    .then(result => {
      fs.writeFile('web/build/wv.css', result.css, function() {});
      if (result.map) {
        // This allows debugging while still minifying the output in dev
        fs.writeFile('web/build/wv.css.map', result.map, function() {});
      }
    });
});
