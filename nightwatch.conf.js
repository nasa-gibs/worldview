const seleniumServer = require('selenium-server-standalone-jar');
const chromedriver = require('chromedriver');
const geckodriver = require('geckodriver');
const glob = require('glob');
const files = glob.sync('./e2e/features/**/*-test.js');
module.exports = {
  output_folder: 'e2e/reports',
  globals_path: 'e2e/globals.js',
  custom_assertions_path: ['e2e/custom-assertions'],
  src_folders: files,
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
      marionette: true
    },
    chrome: {
      desiredCapabilities: {
        browserName: 'chrome'
      }
    },
    firefox: {
      desiredCapabilities: {
        browserName: 'firefox',
        javascriptEnabled: true
      }
    }
  }
};
