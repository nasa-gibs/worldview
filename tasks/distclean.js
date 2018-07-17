#!/usr/bin/env node

const shell = require('shelljs');

shell.rm('-rf', 'node_modules');
shell.rm('-rf', '.python');
