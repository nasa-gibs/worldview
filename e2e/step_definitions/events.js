const {client} = require('nightwatch-cucumber');
const {defineSupportCode} = require('cucumber');

defineSupportCode(({Given, Then, When}) => {

  Then('the tab should have a list of events', function () {
    return client.useCss()
    .waitForElementVisible('#wv-events ul.map-item-list', 3000);
  });

});
