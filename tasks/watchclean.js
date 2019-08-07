#!/usr/bin/env node

const shell = require('shelljs');

let dirs = [
  'web/build'
];

dirs.forEach((dir) => {
  console.log('Removing', dir);
  shell.rm('-rf', dir);
});
