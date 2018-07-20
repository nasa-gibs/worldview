#!/usr/bin/env node

const shell = require('shelljs');
const pkg = require('../package.json');
const moment = require('moment');

let buildNumber = moment.utc().format('YYMMDDHHmmss');
const homedir = require('os').homedir();

console.log('Preparing RPM build');
shell.rm('-rf', `${homedir}/rpmbuild`);
shell.mkdir('-p', `${homedir}/rpmbuild/SOURCES`);
shell.cp('dist/worldview.tar.gz', `${homedir}/rpmbuild/SOURCES`);
shell.cp('rpm/httpd.conf', `${homedir}/rpmbuild/SOURCES`);
shell.cp('rpm/bitly.json', `${homedir}/rpmbuild/SOURCES`);
shell.mkdir('-p', `${homedir}/rpmbuild/SPECS`);
shell.cp('rpm/worldview.spec', `${homedir}/rpmbuild/SPECS`);

console.log('Branding');
let applyTo = `${homedir}/rpmbuild/SPECS/worldview.spec`;
shell.sed('-i', /@WORLDVIEW@/g, 'worldview', applyTo);
shell.sed('-i', /@BUILD_VERSION@/g, pkg.version, applyTo);
shell.sed('-i', /@BUILD_NUMBER@/g, buildNumber, applyTo);

console.log('Building RPM');
shell.exec(`rpmbuild -ba ${homedir}/rpmbuild/SPECS/worldview.spec`);
shell.cp(`${homedir}/rpmbuild/RPMS/noarch/*`, 'dist');
