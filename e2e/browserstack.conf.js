const environments = require('./environments.js');
const glob = require('glob');
const files = glob.sync('./e2e/features/**/*-test.js');
const nightwatchConfig = {
  output_folder: './e2e/reports',
  globals_path: './globals.js',
  custom_assertions_path: ['./e2e/custom-assertions'],
  src_folders: files,
  selenium: {
    start_process: false,
    check_process_delay: 5000,
    host: 'hub-cloud.browserstack.com',
    port: 80
  },
  common_capabilities: {
    'browserstack.user': process.env.BROWSERSTACK_USER,
    'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
    'browserstack.local': true,
    'browserstack.debug': true,
    build: 'nightwatch-browserstack',
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
        marionette: true,
        'browserstack.selenium_version': '2.53.0'
      }
    },
    safari: {
      desiredCapabilities: {
        browser: 'safari',
        'browserstack.selenium_version': '3.5.2',
        'browserstack.safari.driver': '2.45'
      }
    },
    firefox: {
      desiredCapabilities: {
        browser: 'firefox',
        marionette: true,
        browserName: 'firefox',
        javascriptEnabled: true,
        'browserstack.selenium_version': '3.10.0',
        'browserstack.geckodriver': '0.19.0'
      }
    },
    ie: {
      desiredCapabilities: {
        browser: 'internet explorer',
        'browserstack.selenium_version': '2.53.0'
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
  config.selenium_host = nightwatchConfig.selenium.host;
  config.selenium_port = nightwatchConfig.selenium.port;
  config.desiredCapabilities = config.desiredCapabilities || {};
  for (var j in nightwatchConfig.common_capabilities) {
    config.desiredCapabilities[j] = config.desiredCapabilities[j] || nightwatchConfig.common_capabilities[j];
  }
}
module.exports = nightwatchConfig;
