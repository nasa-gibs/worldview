const seleniumServer = require('selenium-server-standalone-jar');
const chromedriver = require('chromedriver');
const geckodriver = require('geckodriver');

require('nightwatch-cucumber')({
  cucumberArgs: [
    '--compiler', 'js:babel-core/register',
    '--require', 'e2e/step_definitions',
    '--format', `json:e2e/reports/cucumber-${process.argv[3]}.json`,
    'e2e/features'
  ]
});

module.exports = {
  output_folder: 'e2e/reports',
  globals_path: 'e2e/globals.js',
  selenium: {
    start_process: false,
    host: 'hub-cloud.browserstack.com',
    port: 80
  },
  test_settings: {
    default: {
      selenium_host: 'hub-cloud.browserstack.com',
      selenium_port: 80,
      desiredCapabilities: {
        'browserstack.user': process.env.BROWSERSTACK_USER,
        'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
        'browserstack.local': true,
        os: 'OS X',
        os_version: 'El Capitan',
        browser: 'Chrome',
        browser_version: '61.0',
        resolution: '1920x1080'
      }
    }
  }
};
