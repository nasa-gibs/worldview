const environments = require('./environments.js');

require('nightwatch-cucumber')({
  nightwatchOutput: false,
  cucumberArgs: [
    '--compiler', 'js:babel-core/register',
    '--require', 'e2e/step_definitions',
    '--format', `json:e2e/reports/cucumber-${process.argv[5]}.json`,
    'e2e/features'
  ]
});

var nightwatchConfig = {
  output_folder: 'e2e/reports',
  globals_path: 'e2e/globals.js',
  custom_assertions_path: ['e2e/custom-assertions'],
  selenium: {
    start_process: false,
    host: 'hub-cloud.browserstack.com',
    port: 80
  },
  common_capabilities: {
    'browserstack.user': process.env.BROWSERSTACK_USER,
    'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
    'browserstack.local': true,
    'browserstack.selenium_version': '3.5.2',
    applicationCacheEnabled: false,
    webStorageEnabled: false,
    marionette: true
  },
  test_settings: {
    default: {},
    browserstack: {
      desiredCapabilities: {
        browser: 'chrome'
      }
    },
    chrome: {
      desiredCapabilities: {
        browser: 'chrome',
        marionette: true
      }
    },
    firefox: {
      desiredCapabilities: {
        browser: 'firefox',
        marionette: true
      }
    }
  }
};

environments.forEach(e => {
  var env = [
    e.browser,
    e.browser_version,
    e.os,
    e.os_version
  ].join('_').replace(/\./g, '-').replace(/ /g, '_');
  nightwatchConfig.test_settings[env] = { desiredCapabilities: e };
});

// Merge common_capabilities with each test_settings key
for (var i in nightwatchConfig.test_settings) {
  var config = nightwatchConfig.test_settings[i];
  config['selenium_host'] = nightwatchConfig.selenium.host;
  config['selenium_port'] = nightwatchConfig.selenium.port;
  config['desiredCapabilities'] = config['desiredCapabilities'] || {};
  for (var j in nightwatchConfig.common_capabilities) {
    config['desiredCapabilities'][j] = config['desiredCapabilities'][j] || nightwatchConfig.common_capabilities[j];
  }
}

module.exports = nightwatchConfig;
