#!/usr/bin/env node

const shell = require('shelljs');

let dirs = [
  'node_modules',
  '.python',
];

dirs.forEach((dir) => {
  console.log('Removing', dir);
  shell.rm('-rf', dir);
});
