const seleniumServer = require('selenium-server-standalone-jar');
const chromedriver = require('chromedriver');
const geckodriver = require('geckodriver');
const files = './e2e/features';
module.exports = {
  output_folder: 'e2e/reports',
  globals_path: 'e2e/globals.js',
  custom_assertions_path: ['e2e/custom-assertions'],
  src_folders: files,
  selenium: {
    start_process: true,
    server_path: seleniumServer.path,
    port: 4444,
    check_process_delay: 5000,
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
        browserName: 'chrome',
        'goog:chromeOptions': {
          w3c: false,
          prefs: { 'profile.managed_default_content_settings.notifications': 1 }
        }
      }
    },
    chromeHeadless: {
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          w3c: false,
          prefs: { 'profile.managed_default_content_settings.notifications': 1 },
          args: ['headless', 'no-sandbox', 'disable-gpu']
        }
      }
    },
    firefox: {
      desiredCapabilities: {
        browserName: 'firefox',
        javascriptEnabled: true
      }
    },
    firefoxHeadless: {
      desiredCapabilities: {
        browserName: 'firefox',
        javascriptEnabled: true,
        'moz:firefoxOptions': {
          args: ['--headless']
        }
      }
    }
  }
};
