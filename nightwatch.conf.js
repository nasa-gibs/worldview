const seleniumServer = require('selenium-server-standalone-jar')
const chromedriver = require('chromedriver')
const geckodriver = require('geckodriver')

const files = './e2e/features'
module.exports = {
  output_folder: 'e2e/reports',
  globals_path: 'e2e/globals.js',
  custom_assertions_path: ['e2e/custom-assertions'],
  src_folders: files,
  test_workers: {
    enabled: true,
    workers: 'auto'
  },
  test_settings: {
    default: {
      disable_error_log: false,
      launch_url: 'http://localhost',
      selenium_port: 4444,
      selenium_host: 'localhost',

      screenshots: {
        enabled: false,
        path: 'e2e/screens',
        on_failure: true
      },

      desiredCapabilities: {
        browserName: 'chromeHeadless'
      },

      webdriver: {
        start_process: true,
        server_path: ''
      }
    },
    selenium_server: {
      selenium: {
        start_process: true,
        port: 4444,
        server_path: seleniumServer.path, // Leave empty if @nightwatch/selenium-server is installed
        command: 'standalone', // Selenium 4 only
        check_process_delay: 10000,
        cli_args: {
          'webdriver.chrome.driver': chromedriver.path,
          'webdriver.gecko.driver': geckodriver.path,
          'webdriver.firefox.profile': 'nightwatch',
          'webdriver.gecko.profile': 'nightwatch'
        }
      },
      webdriver: {
        start_process: false,
        default_path_prefix: '/wd/hub'
      }
    },
    chrome: {
      extends: 'selenium_server',
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          w3c: true,
          prefs: { 'profile.managed_default_content_settings.notifications': 1 }
        }
      }
    },
    chromeHeadless: {
      extends: 'selenium_server',
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          w3c: true,
          prefs: { 'profile.managed_default_content_settings.notifications': 1 },
          args: [
            '--no-sandbox',
            '--disable-gpu',
            '--headless'
          ]
        }
      }
    },
    chromeLocalStorageDisabled: {
      extends: 'selenium_server',
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          w3c: true,
          prefs: { 'profile.managed_default_content_settings.notifications': 1 },
          args: [
            '--no-sandbox',
            '--disable-gpu',
            '--headless',
            '--disable-local-storage'
          ]
        }
      }
    },
    firefox: {
      extends: 'selenium_server',
      desiredCapabilities: {
        browserName: 'firefox',
        javascriptEnabled: true
      }
    },
    firefoxHeadless: {
      extends: 'selenium_server',
      desiredCapabilities: {
        browserName: 'firefox',
        javascriptEnabled: true,
        'moz:firefoxOptions': {
          args: ['--headless']
        }
      }
    },
    firefoxLocalStorageDisabled: {
      extends: 'selenium_server',
      desiredCapabilities: {
        browserName: 'firefox',
        javascriptEnabled: true,
        'moz:firefoxOptions': {
          args: ['--headless'],
          prefs: {
            'dom.storage.enabled': false
          }
        }
      }
    }
  }
}
