const bsCapabilities = require('browserstack-capabilities');

const createCapabilities = bsCapabilities(
  process.env.BROWSERSTACK_USER,
  process.env.BROWSERSTACK_ACCESS_KEY
).create;

const capabilities = createCapabilities([{
  browser: 'firefox',
  browser_version: ['56.0'],
  os: ['Windows', 'OS X'],
  os_version: ['10', '8.1', 'Sierra']
}, {
  browser: 'chrome',
  browser_version: ['52.0', '61.0'],
  os: ['Windows', 'OS X'],
  os_version: ['10', '8.1', 'Sierra']
}, {
  browser: 'safari',
  browser_version: ['10.1'],
  os: ['OS X'],
  os_version: ['Sierra']
}, {
  browser: 'ie',
  browser_version: ['10.0', '11.0'],
  os: ['Windows'],
  os_version: ['10', '8.1']
}, {
  browser: 'edge',
  browser_version: ['14.0', '15.0'],
  os: ['Windows'],
  os_version: ['10']
}]);

capabilities.forEach((capability) => {
  capability.resolution = '1280x1024';
});

module.exports = capabilities;
