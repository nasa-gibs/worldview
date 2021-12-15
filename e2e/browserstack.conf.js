const glob = require('glob');
const environments = require('./environments.js');

const files = glob.sync('./e2e/features/**/*-test.js');
const now = new Date();
const timeStamp = `${now.getMonth() + 1}/${now.getDate()} @ ${now.getHours()}:${now.getMinutes()}`;

const nightwatchConfig = {
  output_folder: './e2e/reports',
  globals_path: './globals.js',
  custom_assertions_path: ['./e2e/custom-assertions'],
  src_folders: files,
  selenium: {
    start_process: false,
    host: 'hub-cloud.browserstack.com',
    port: 80,
  },
  common_capabilities: {
    'browserstack.user': process.env.BROWSERSTACK_USER,
    'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
    'browserstack.local': true,
    'browserstack.debug': true,
    'browserstack.localIdentifier': `wvtester19234${process.env.BROWSERSTACK_USER}`.replace(/[^a-zA-Z0-9]/g, ''),
    build: `wv-nightwatch-${timeStamp}`,
    applicationCacheEnabled: false,
    webStorageEnabled: false,
    marionette: true,
    project: 'Worldview',
  },
  test_settings: {
    default: {},
    browserstack: {
      desiredCapabilities: {
        browser: 'chrome',
      },
    },
    chrome: {
      desiredCapabilities: {
        browser: 'chrome',
        marionette: true,
        'browserstack.selenium_version': '3.5.2',
      },
    },
    safari: {
      desiredCapabilities: {
        browser: 'safari',
        'browserstack.selenium_version': '3.5.2',
      },
    },
    firefox: {
      desiredCapabilities: {
        browser: 'firefox',
        marionette: true,
        browserName: 'firefox',
        javascriptEnabled: true,
        'browserstack.selenium_version': '3.10.0',
        'browserstack.geckodriver': '0.24.0',
      },
    },
  },
};

environments.forEach((e) => {
  const env = [
    e.browser,
    e.browser_version,
    e.os,
    e.os_version,
  ].join('_').replace(/\./g, '-').replace(/ /g, '_');
  nightwatchConfig.test_settings[env] = { desiredCapabilities: e };
});

// Merge common_capabilities with each test_settings key
Object.keys(nightwatchConfig.test_settings).forEach((settingKey) => {
  const config = nightwatchConfig.test_settings[settingKey];
  config.selenium_host = nightwatchConfig.selenium.host;
  config.selenium_port = nightwatchConfig.selenium.port;
  config.desiredCapabilities = config.desiredCapabilities || {};
  const capabilityKeys = Object.keys(nightwatchConfig.common_capabilities);
  capabilityKeys.forEach((capabilityKey) => {
    config.desiredCapabilities[capabilityKey] = config.desiredCapabilities[capabilityKey]
      || nightwatchConfig.common_capabilities[capabilityKey];
  });
});
module.exports = nightwatchConfig;
