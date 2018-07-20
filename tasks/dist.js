#!/usr/bin/env node

const fs = require('fs');
const pkg = require('../package.json');
const moment = require('moment');
const shell = require('shelljs');
const tar = require('tar');

console.log('Preparing distribution');
shell.rm('-rf', 'build/worldview');
shell.mkdir('-p', 'build/worldview');
shell.cp('-rf', 'web/*', 'build/worldview');

console.log('Branding');
let brand = require('../build/worldview/brand/brand.json');
let applyTo = [
  'build/worldview/index.html',
  'build/worldview/build/wv.js',
  'build/worldview/pages/about.html'
];

// Build date shown in the About box
let buildTimestamp = moment.utc().format('MMMM DD, YYYY [-] HH:mm [UTC]');

// Append to all URI references for cache busting
let buildNonce = moment.utc().format('YYYYMMDDHHmmssSSS');

let officialName = brand.officialName || brand.name;
let longName = brand.longName || brand.name;
let shortName = brand.shortName || brand.name;
let email = brand.email || 'support@example.com';

shell.sed('-i', /@OFFICIAL_NAME@/g, officialName, applyTo);
shell.sed('-i', /@LONG_NAME@/g, longName, applyTo);
shell.sed('-i', /@NAME@/g, shortName, applyTo);
shell.sed('-i', /@MAIL@/g, email, applyTo);
shell.sed('-i', /@BUILD_NONCE/g, buildNonce, applyTo);
shell.sed('-i', /@BUILD_TIMESTAMP@/g, buildTimestamp, applyTo);
shell.sed('-i', /@BUILD_VERSION@/g, pkg.version, applyTo);

let dist = 'dist/worldview.tar.gz';
console.log(`Creating distribution: ${dist}`);
shell.mkdir('-p', 'dist');
tar.c({
  gzip: true,
  portable: true,
  C: 'build'
}, ['worldview']).pipe(fs.createWriteStream(dist));
