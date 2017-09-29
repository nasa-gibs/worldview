const {client} = require('nightwatch-cucumber');
const {defineSupportCode} = require('cucumber');
const delay = client.globals.delay;

defineSupportCode(({Given, Then, When}) => {

  Then('I see {int}+ markers on the map', (count) => {
    return client.assert.elementCountGreater(client.globals.selectors['map marker'], count);
  });

});
