#!/usr/bin/env node
/* eslint-disable no-restricted-syntax */

const fs = require('fs');
const glob = require('glob');
const showdown = require('showdown');
const shell = require('shelljs');

console.log('Converting markdown to html');
const converter = new showdown.Converter({
  openLinksInNewWindow: true,
  // don't require escaping underscores in the middle of a word
  literalMidWordUnderscores: true,
});

const configFiles = glob.sync('build/options/config/metadata/**/*.md');
for (const configFile of configFiles) {
  const dest = configFile.replace(/\.md$/, '.html');
  const markdown = fs.readFileSync(configFile, { encoding: 'utf-8' });
  const html = converter.makeHtml(markdown);
  fs.writeFileSync(dest, html);
}

const storyFiles = glob.sync('build/options/stories/**/*.md');
for (const configFile of storyFiles) {
  const dest = configFile.replace(/\.md$/, '.html');
  const markdown = fs.readFileSync(configFile, { encoding: 'utf-8' });
  const html = converter.makeHtml(markdown);
  fs.writeFileSync(dest, html);
}

console.log('Copying options to web directory');
shell.cp('-r', 'build/options/config', 'web');
shell.cp('-r', 'build/options/brand', 'web');
shell.cp('-r', 'build/options/brand.json', 'web/brand');

console.log('Adding .htaccess files to options');
const htaccess = `
ExpiresActive On
ExpiresDefault A0
Header set Cache-Control "no-cache, must-revalidate, public"
Header set Pragma "no-cache"
`;
fs.writeFileSync('web/brand/.htaccess', htaccess);
fs.writeFileSync('web/config/.htaccess', htaccess);
