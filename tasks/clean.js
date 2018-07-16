#!/usr/bin/env node

const shell = require('shelljs');

shell.rm('-rf', 'build');
shell.rm('-rf', 'dist');
shell.rm('-rf', 'web/brand');
shell.rm('-rf', 'web/build');
shell.rm('-rf', 'web/config');
