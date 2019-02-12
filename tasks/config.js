#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const showdown = require('showdown');
const shell = require('shelljs');

console.log('Converting markdown to html');
let converter = new showdown.Converter();

let configFiles = glob.sync('build/options/config/metadata/**/*.md');
for (let configFile of configFiles) {
  let dest = configFile.replace(/\.md$/, '.html');
  let markdown = fs.readFileSync(configFile, { encoding: 'utf-8' });
  let html = converter.makeHtml(markdown);
  fs.writeFileSync(dest, html);
}

let storyFiles = glob.sync('build/options/stories/**/*.md');
for (let configFile of storyFiles) {
  let dest = configFile.replace(/\.md$/, '.html');
  let markdown = fs.readFileSync(configFile, { encoding: 'utf-8' });
  let html = converter.makeHtml(markdown);
  fs.writeFileSync(dest, html);
}

console.log('Copying options to web directory');
shell.cp('-r', 'build/options/config', 'web');
shell.cp('-r', 'build/options/brand', 'web');
shell.cp('-r', 'build/options/brand.json', 'web/brand');

console.log('Adding .htaccess files to options');
let htaccess = `
ExpiresActive On
ExpiresDefault A0
Header set Cache-Control "no-cache, must-revalidate, public"
Header set Pragma "no-cache"
`;
fs.writeFileSync('web/brand/.htaccess', htaccess);
fs.writeFileSync('web/config/.htaccess', htaccess);
