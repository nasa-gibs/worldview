const {client} = require('nightwatch-cucumber');
const {defineSupportCode} = require('cucumber');
const delay = client.globals.delay;
const selectors = client.globals.selectors;

defineSupportCode(({Given, Then, When}) => {
  Given('Worldview is in initial state', () => {
    return client.url(client.globals.url).waitForElementVisible('body', delay);
  });

  // Scroll to an element by predefined selector
  When('I scroll to the {string}', (label) => {
    return client.useCss().moveToElement(selectors[label], 10, 10);
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
  When('I click the {string}', (label) => {
    return client.useCss().click(selectors[label]);
  });

  // Click a Worldview tab
  When('I click the {string} tab', (name) => {
    return client.useCss().click('[data-tab="' + name + '"]');
  });

  // Input a value into a labeled element
  When('I input {string} in the {string}', (value, label) => {
    return client.useCss().setValue(selectors[label], value);
  });

  // Wait until an element is visible
  When('I wait to see {string}', (label) => {
    return client.useCss().waitForElementVisible(selectors[label], delay);
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

  // Check for an element by predefined selector
  Then('I should see the {string}', (label) => {
    return client.useCss().expect.element(selectors[label]).to.be.visible;
  });

  // Check for abscense of an element by predefined selector
  Then('I should not see the {string}', (label) => {
    return client.useCss().expect.element(selectors[label]).to.not.be.present;
  });

});
