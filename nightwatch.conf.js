require('nightwatch-cucumber')({
  cucumberArgs: [
    '--compiler', 'js:babel-core/register',
    '--require', 'e2e/step_definitions',
    '--format', 'json:e2e/reports/cucumber.json',
    'e2e/features'
  ]
});

module.exports = {
  // src_folders: ['./e2e/tests'],
  output_folder: './e2e/reports',
  globals_path: './e2e/globals.js',
  selenium: {
    start_process: true,
    server_path: 'node_modules/selenium-server-standalone-jar/jar/selenium-server-standalone-3.0.1.jar',
    port: 4444,
    cli_args: {
      'webdriver.chrome.driver': 'node_modules/chromedriver/lib/chromedriver/chromedriver',
      'webdriver.gecko.driver': 'node_modules/geckodriver/bin/geckodriver'
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
