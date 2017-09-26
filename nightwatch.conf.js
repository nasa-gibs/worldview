const seleniumServer = require('selenium-server-standalone-jar');
const chromedriver = require('chromedriver');
const geckodriver = require('geckodriver');

require('nightwatch-cucumber')({
  cucumberArgs: [
    '--compiler', 'js:babel-core/register',
    '--require', 'e2e/step_definitions',
    '--format', 'json:e2e/reports/cucumber.json',
    'e2e/features'
  ]
});

module.exports = {
  output_folder: './e2e/reports',
  globals_path: './e2e/globals.js',
  live_output: false,
  selenium: {
    start_process: true,
    server_path: seleniumServer.path,
    port: 4444,
    cli_args: {
      'webdriver.chrome.driver': chromedriver.path,
      'webdriver.gecko.driver': geckodriver.path,
      'webdriver.firefox.profile': 'nightwatch',
      'webdriver.gecko.profile': 'nightwatch'
    }
  },
  test_settings: {
    default: {
      launch_url: 'http://localhost',
      selenium_port: 4444,
      selenium_host: 'localhost',
      silent: true,
      desiredCapabilities: {
        browserName: 'chrome',
        marionette: true
      }
    },
    firefox: {
      desiredCapabilities: {
        browserName: 'firefox'
      }
    }
  }
};
