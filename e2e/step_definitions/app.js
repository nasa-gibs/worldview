const {client} = require('nightwatch-cucumber');
const {defineSupportCode} = require('cucumber');

defineSupportCode(({Given, Then, When}) => {
  Given('Worldview is in initial state', () => {
    return client.url(client.globals.url).waitForElementVisible('body', 1000);
  });

  // Select any element that contains the string
  When('I click {string}', function (string) {
    return client.useXpath().click('//*[contains(text(),"' + string + '")]');
  });

  // Select a link by link text
  When('I click on the {string} link', function (text) {
    return client.useXpath().click('//a[text()="'+ text +'"]');
  });

  // Select a Worldview tab
  When('I click the {string} tab', function(name) {
    return client.useCss().click('[data-tab="' + name + '"]');
  });

  // Check for a string
  Then('I should see {string}', function (text) {
    return client.useCss().assert.containsText('body', text);
  });

  // Check for a string
  Then('I should not see {string}', function (text) {
    return client.useCss().expect.element('body').text.not.contains(text);
  });

});
