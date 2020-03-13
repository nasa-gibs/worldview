#!/usr/bin/env node

const shell = require('shelljs');

const dirs = [
  'web/build',
];

dirs.forEach((dir) => {
  console.log('Removing', dir);
  shell.rm('-rf', dir);
});
