const {client} = require('nightwatch-cucumber');
const {defineSupportCode} = require('cucumber');
const delay = client.globals.delay;

defineSupportCode(({Given, Then, When}) => {

  Then('the tab should have a list of events', function () {
    return client.useCss()
    .waitForElementVisible('#wv-events ul.map-item-list', delay);
  });

});
