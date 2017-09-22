const {client} = require('nightwatch-cucumber');
const {defineSupportCode} = require('cucumber');
const delay = client.globals.delay;
const selectors = client.globals.selectors;
const querystrings = client.globals.querystrings;

defineSupportCode(({Given, Then, When}) => {
  Given('Worldview is in {string} state', (state) => {
    var stateUrl = client.globals.url + (querystrings[state]||'');
    return client.url(stateUrl).waitForElementVisible('body', delay);
  });

  // Scroll to an element by predefined selector
  When('I scroll to the {string}', (key) => {
    return client.useCss().moveToElement(selectors[key]||key, 10, 10);
  });

  // Click any element that contains the string
  When('I click {string}', (string) => {
    return client.useXpath().click('//*[contains(text(),"' + string + '")]');
  });

  // Click a link by link text
  When('I click the {string} link', (text) => {
    return client.useXpath().click('//a[text()="'+ text +'"]');
  });

  // Click an element by predefined selector
  When('I click the {string}', (key) => {
    return client.useCss().click(selectors[key]||key);
  });

  // Click a Worldview tab
  When('I click the {string} tab', (name) => {
    return client.useCss().click('[data-tab="' + name + '"]');
  });

  // Input a value into a keyed element
  When('I input {string} in the {string}', (value, key) => {
    return client.useCss().setValue(selectors[key]||key, value);
  });

  // Pause for n seconds
  When('I wait {int} seconds', (seconds) => {
    return client.pause(seconds*1000);
  });

  // Check for a string
  Then('I should see {string}', (text) => {
    return client.useCss().assert.containsText('body', text);
  });

  // Check for a string
  Then('I should not see {string}', (text) => {
    return client.useCss().expect.element('body').text.not.contains(text);
  });

  // Check that an element is visible by predefined selector
  Then('I should see the {string}', (key) => {
    return client.useCss().expect.element(selectors[key]||key).to.be.visible;
  });

  // Wait for an element to be visible
  Then('I should see the {string} within {int} seconds', (key, seconds) => {
    return client.useCss().expect.element(selectors[key]||key).to.be.visible.before(seconds*1000);
  });

  // Check for an element by predefined selector
  Then('the page should have the {string}', (key) => {
    return client.useCss().expect.element(selectors[key]||key).to.be.present;
  });

  // Check for abscense of an element by predefined selector
  Then('the page should not have the {string}', (key) => {
    return client.useCss().expect.element(selectors[key]||key).to.not.be.present;
  });

  // Check that an element is hidden
  Then('I should not see the {string}', (key) => {
    return client.useCss().expect.element(selectors[key]||key).to.not.be.visible;
  });

});
