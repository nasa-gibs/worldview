var reporter = require('cucumber-html-reporter');
var browser = process.argv[2];
var Browser = browser.charAt(0).toUpperCase() + browser.substring(1);

reporter.generate({
  name: 'Worldview Tests: ' + Browser,
  theme: 'hierarchy',
  jsonFile: 'e2e/reports/cucumber-' + browser + '.json',
  output: 'e2e/reports/cucumber-' + browser + '.html',
  reportSuiteAsScenarios: true,
  launchReport: true
});
