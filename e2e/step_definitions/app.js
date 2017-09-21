const {client} = require('nightwatch-cucumber');
const {defineSupportCode} = require('cucumber');

var labels = {
  'info button': '.wv-layers-info',
  'options button': '.wv-layers-options',
  'info dialog': '[aria-describedby="wv-layers-info-dialog"]',
  'options dialog': '[aria-describedby="wv-layers-options-dialog"]'
}

defineSupportCode(({Given, Then, When}) => {
  Given('Worldview is in initial state', () => {
    return client.url(client.globals.url).waitForElementVisible('body', 1000);
  });

  // Click any element that contains the string
  When('I click {string}', function (string) {
    return client.useXpath().click('//*[contains(text(),"' + string + '")]');
  });

  // Click a link by link text
  When('I click the {string} link', function (text) {
    return client.useXpath().click('//a[text()="'+ text +'"]');
  });

  // Click a button by predefined label
  When('I click the {string}', function (label) {
    return client.useCss().click(labels[label]);
  });

  // Click a Worldview tab
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

  // Click for an element by predefined label
  Then('I should see the {string} element', function (label) {
    return client.useCss().expect.element(labels[label]).to.be.visible;
  });

  // Click for abscense of an element by predefined label
  Then('I should not see the {string} element', function (label) {
    return client.useCss().expect.element(labels[label]).to.not.be.present;
  });

});
