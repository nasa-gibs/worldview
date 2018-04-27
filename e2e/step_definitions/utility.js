const { client } = require('nightwatch-cucumber');
const { defineSupportCode } = require('cucumber');
const delay = client.globals.delay;
const selectors = client.globals.selectors;
const querystrings = client.globals.querystrings;

defineSupportCode(({ Given, Then, When }) => {
  Given('Worldview is in {string} state', (state) => {
    var stateUrl = client.globals.url + (querystrings[state] || '');
    client.url(stateUrl).execute('if (window.localStorage) window.localStorage.clear()');
    client.pause(delay); // Give the page some time to load
    return client.waitForElementVisible('body', delay / 2);
  });

  // Scroll to an element by predefined selector
  When('I scroll to the {string}', (key) => {
    return client.useCss().moveToElement(selectors[key] || key, 10, 10);
  });

  // Click any element that contains the string
  When('I click {string}', (string) => {
    return client.useXpath().click('//*[contains(text(),"' + string + '")]');
  });

  // Click a link by link text
  When('I click the {string} link', (text) => {
    return client.useXpath().click('//a[text()="' + text + '"]');
  });

  // Click an element by predefined selector
  When('I click the {string}', (key) => {
    return client.useCss().click(selectors[key] || key);
  });

  // Click a Worldview tab
  When('I click the {string} tab', (name) => {
    return client.useCss().click('[data-tab="' + name + '"]');
  });

  // Input a value into a keyed element
  When('I input {string} in the {string}', (value, key) => {
    return client.useCss().setValue(selectors[key] || key, value);
  });

  // Pause for n seconds
  When('I wait {int} seconds', (seconds) => {
    return client.pause(seconds * 1000);
  });

  // Check the url
  Then('the url has these values:', (table) => {
    table.rawTable.forEach(function (row) {
      client.assert.urlParameterEquals(row[0], row[1]);
    });
    return client;
  });

  // Check the number of tabs open
  Then('there are {int} tabs open', (count) => {
    return client.windowHandles(function (tabs) {
      client.assert.equal(tabs.value.length, count);
    });
  });

  // Close a tab by index
  Then('I close tab number {int}', (index) => {
    index--;
    return client.windowHandles(function (tabs) {
      client.switchWindow(tabs.value[index]);
      client.closeWindow(function () {
        return client.switchWindow(tabs.value[0]);
      });
    });
  });

  // Check for a string
  Then('I see {string}', (text) => {
    return client.useCss().assert.containsText('body', text);
  });

  // Wait for an element to be visible
  Then('I see {string} within {int} seconds', (text, seconds) => {
    return client.useCss().expect.element('body').text.to.contain(text).before(seconds * 1000);
  });

  // Check for a string
  Then('I don\'t see {string}', (text) => {
    return client.useCss().expect.element('body').text.not.contains(text);
  });

  // Check that an element is visible by predefined selector
  Then('I see the {string}', (key) => {
    return client.useCss().expect.element(selectors[key] || key).to.be.visible;
  });

  // Wait for an element to be visible
  Then('I see the {string} within {int} seconds', (key, seconds) => {
    return client.useCss().expect.element(selectors[key] || key).to.be.visible.before(seconds * 1000);
  });

  // Check for an element by predefined selector
  Then('the page has the {string}', (key) => {
    return client.useCss().expect.element(selectors[key] || key).to.be.present;
  });

  // Check for abscense of an element by predefined selector
  Then('the page doesn\'t have the {string}', (key) => {
    return client.useCss().expect.element(selectors[key] || key).to.not.be.present;
  });

  // Check for a count of elements
  Then('the page has at least {int} {string}', (count, selector) => {
    return client.assert.elementCountGreater(client.globals.selectors[selector], count);
  });

  // Check that an element is hidden
  Then('I don\'t see the {string}', (key) => {
    return client.useCss().expect.element(selectors[key] || key).to.not.be.visible;
  });
});
