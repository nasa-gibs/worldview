#!/usr/bin/env node

const shell = require('shelljs');

const dirs = [
  'node_modules',
  '.python',
];

dirs.forEach((dir) => {
  console.log('Removing', dir);
  shell.rm('-rf', dir);
});
