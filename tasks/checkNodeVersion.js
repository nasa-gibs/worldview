/* eslint no-console: "off" */
var pkg = require('../package.json');
var requiredVersion = 'v' + pkg.engines.node;
var nodeBeingUsed = process.version;

if (requiredVersion !== nodeBeingUsed) {
  console.log('\x1b[31m', '\x1b[1m'); // Added styling to warn
  console.log('WARN ', '\x1b[0m', 'The suggested version of node for the installation of Worldview is', '\x1b[32m', '\x1b[1m', requiredVersion, '\x1b[0m', ' you are using', '\x1b[32m', '\x1b[1m', nodeBeingUsed);
  console.log('\x1b[0m', 'If you have difficulties installing Worldview, please try using the install again using the node version', '\x1b[32m', '\x1b[1m', requiredVersion, '\x1b[0m');
}
