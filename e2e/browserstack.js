#!/usr/bin/env node
/* eslint no-console: "off", camelcase: "off" */

var Nightwatch = require('nightwatch');
var browserstack = require('browserstack-local');
var environments = require('./environments.js');
var bs_local;

var environment_names = environments.map(
  e => {
    return [
      e.browser,
      e.browser_version,
      e.os,
      e.os_version
    ].join('_').replace(/\./g, '-').replace(/ /g, '_');
  }
);

try {
  process.mainModule.filename = './node_modules/.bin/nightwatch';

  // Code to start browserstack local before start of test
  console.log('Connecting localhost to Browserstack...');
  Nightwatch.bs_local = bs_local = new browserstack.Local();
  bs_local.start({ 'key': process.env.BROWSERSTACK_ACCESS_KEY }, function (error) {
    if (error) throw new Error(error);

    console.log('Connected. Running tests...');
    console.log('Go to https://www.browserstack.com/automate to view tests in progress.');
    Nightwatch.cli(function (argv) {
      var envString = environment_names.join(',');
      argv.e = envString;
      argv.env = envString;
      Nightwatch.CliRunner(argv)
        .setup(null, function () {
          // Code to stop browserstack local after end of parallel test
          bs_local.stop(function () {});
        })
        .runTests(function () {
          // Code to stop browserstack local after end of single test
          bs_local.stop(function () {});
        });
    });
  });
} catch (ex) {
  console.log('There was an error while starting the test runner:\n\n');
  process.stderr.write(ex.stack + '\n');
  process.exit(2);
}
