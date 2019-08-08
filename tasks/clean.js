#!/usr/bin/env node

const shell = require('shelljs');

const dirs = [
  'build',
  'dist',
  'web/brand',
  'web/config'
];

dirs.forEach((dir) => {
  console.log('Removing', dir);
  shell.rm('-rf', dir);
});
