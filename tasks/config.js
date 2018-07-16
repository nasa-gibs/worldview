#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const showdown = require('showdown');
const shell = require('shelljs');

console.log('Converting markdown to html');
let converter = new showdown.Converter();

// Convert markdown files to HTML
let files = glob.sync('build/options/config/metadata/**/*.md');
for (let file of files) {
  let dest = file.replace(/\.md$/, '.html');
  let markdown = fs.readFileSync(file, { encoding: 'utf-8' });
  let html = converter.makeHtml(markdown);
  fs.writeFileSync(dest, html);
}

console.log('Copying options to web directory');
shell.cp('-r', 'build/options/config', 'web/config');
shell.cp('-r', 'build/options/brand', 'web/brand');
shell.cp('-r', 'build/options/brand.json', 'web/brand');
