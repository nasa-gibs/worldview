const { normalizeViewport } = require('../../reuseables/normalize-viewport.js');

module.exports = {
  '@tags': ['localStorageDisabled'],
  before(client) {
    normalizeViewport(client, 1000, 850);
    client.url(client.globals.url);
  },
  'Verify tour modal does not display when local storage disabled': function(client, done) {
    client.execute(function() {
      let enabled;
      try {
        if (window.localStorage) {
          const uid = new Date().toString();
          window.localStorage.setItem(uid, uid);
          enabled = window.localStorage.getItem(uid) === uid;
          window.localStorage.removeItem(uid);
        }
      } catch (error) {
        enabled = false;
      }
      return !!enabled;
    },
    [],
    function(result) {
      if (result.value) {
        throw new Error('Local storage enabled for test that expected disabled.');
      }
      // eslint-disable-next-line no-console
      console.log('Local storage disabled');
      client.assert.not.elementPresent('.tour-start');
    });
  },
  after(client) {
    client.end();
  },
};
