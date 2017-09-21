var reporter = require('cucumber-html-reporter');

var options = {
  name: 'Worldview e2e Tests',
  theme: 'bootstrap',
  jsonFile: 'e2e/reports/cucumber.json',
  output: 'e2e/reports/cucumber.html',
  reportSuiteAsScenarios: true,
  launchReport: true
};

reporter.generate(options);
