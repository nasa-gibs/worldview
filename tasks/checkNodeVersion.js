/* eslint no-console: "off" */
const pkg = require('../package.json');

// modified versionCompare function from https://stackoverflow.com/a/6832721
const versionCompare = (v1, v2) => {
  let v1parts = v1.split('.');
  let v2parts = v2.split('.');

  while (v1parts.length < v2parts.length) v1parts.push('0');
  while (v2parts.length < v1parts.length) v2parts.push('0');

  v1parts = v1parts.map(Number);
  v2parts = v2parts.map(Number);
  for (let i = 0; i < v1parts.length; i += 1) {
    if (v2parts.length === i) {
      return true;
    }
    if (v1parts[i] !== v2parts[i]) {
      if (v1parts[i] > v2parts[i]) {
        return true;
      }
      return false;
    }
  }

  return true;
};

const [minVersion] = pkg.engines.node.split(' ');
const nodeVersion = process.version;
const requiredVersionSub = minVersion.substr(2, minVersion.length);
const nodeVersionSub = nodeVersion.substr(1, nodeVersion.length);

const satisfiyMinVersion = versionCompare(nodeVersionSub, requiredVersionSub);

if (!satisfiyMinVersion) {
  const requiredVersionText = pkg.engines.node;
  console.log('\x1b[31m', '\x1b[1m'); // Added styling to warn
  console.log('WARN', '\x1b[0m', 'The suggested version of node for the installation of Worldview is', '\x1b[32m', '\x1b[1m', requiredVersionText, '\x1b[0m', ' you are using', '\x1b[32m', '\x1b[1m', nodeVersion);
  console.log('\x1b[0m', 'If you have difficulties installing Worldview, please try using the install again using a compatible node version', '\x1b[32m', '\x1b[1m', requiredVersionText, '\x1b[0m');
} else {
  console.log('\x1b[0mPreinstall conditions satisfied. Installing...', '\x1b[0m');
}
