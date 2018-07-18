#!/usr/bin/env node

const shell = require('shelljs');

let dirs = [
  'build',
  'dist',
  'web/brand',
  'web/build',
  'web/config'
];

dirs.forEach((dir) => {
  console.log('Removing', dir);
  shell.rm('-rf', dir);
});
