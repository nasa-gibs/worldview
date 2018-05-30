const bsCapabilities = require('browserstack-capabilities');

const createCapabilities = bsCapabilities(
  process.env.BROWSERSTACK_USER,
  process.env.BROWSERSTACK_ACCESS_KEY
).create;

const capabilities = createCapabilities([{
  browser: 'firefox',
  browser_version: ['59.0'],
  os: ['Windows'],
  os_version: ['10']
}, {
  browser: 'safari',
  browser_version: ['11.1'],
  os: ['OS X'],
  os_version: ['High Sierra']
}, {
  browser: 'chrome',
  browser_version: ['66.0'],
  os: ['Windows', 'OS X'],
  os_version: ['10', 'Sierra']
}, {
  browser: 'ie',
  browser_version: ['11.0'],
  os: ['Windows'],
  os_version: ['10']
}]);

capabilities.forEach((capability) => {
  capability.resolution = '1280x1024';
});

module.exports = capabilities;
