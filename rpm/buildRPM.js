#!/usr/bin/env node

const shell = require('shelljs');
const pkg = require('../package.json');
const moment = require('moment');

let buildNumber = moment.utc().format('YYMMDDHHmmss');

console.log('Preparing RPM build');
shell.mkdir('-p', 'build/rpm/SOURCES');
shell.cp('dist/worldview.tar.gz', 'build/rpm/SOURCES');
shell.cp('rpm/httpd.conf', 'build/rpm/SOURCES');
shell.mkdir('-p', 'build/rpm/SPECS');
shell.cp('rpm/worldview.spec', 'build/rpm/SPECS');

console.log('Branding');
let applyTo = 'build/rpm/SPECS/worldview.spec';
shell.sed('-i', /@WORLDVIEW@/g, 'worldview', applyTo);
shell.sed('-i', /@BUILD_VERSION@/g, pkg.version, applyTo);
shell.sed('-i', /@BUILD_NUMBER@/g, buildNumber, applyTo);

console.log('Building RPM');
let pwd = process.env.PWD;
shell.exec(`rpmbuild --define \\"_topdir ${pwd}/build/rpm\\" -ba build/rpm/SPECS/worldview.spec`);
