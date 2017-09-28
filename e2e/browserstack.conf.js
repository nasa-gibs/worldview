const seleniumServer = require('selenium-server-standalone-jar');
const chromedriver = require('chromedriver');
const geckodriver = require('geckodriver');
const environments = require('./environments.json');

require('nightwatch-cucumber')({
  nightwatchOutput: false,
  cucumberArgs: [
    '--compiler', 'js:babel-core/register',
    '--require', 'e2e/step_definitions',
    '--format', `json:e2e/reports/cucumber-${process.argv[5]}.json`,
    'e2e/features'
  ]
});

var nightwatch_config = {
  output_folder: 'e2e/reports',
  globals_path: 'e2e/globals.js',
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

environments.forEach(e=>{
  var env = [
    e.browser,
    e.browser_version,
    e.os,
    e.os_version
  ].join('_').replace(/\./g, '-').replace(/ /g, '_');
  nightwatch_config.test_settings[env] = {desiredCapabilities: e}
});

// Merge common_capabilities with each test_settings key
for(var i in nightwatch_config.test_settings){
  var config = nightwatch_config.test_settings[i];
  config['selenium_host'] = nightwatch_config.selenium.host;
  config['selenium_port'] = nightwatch_config.selenium.port;
  config['desiredCapabilities'] = config['desiredCapabilities'] || {};
  for(var j in nightwatch_config.common_capabilities){
    config['desiredCapabilities'][j] = config['desiredCapabilities'][j] || nightwatch_config.common_capabilities[j];
  }
}

module.exports = nightwatch_config;
