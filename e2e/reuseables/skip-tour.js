const normalizeViewport = require('./normalize-viewport.js').normalizeViewport;
module.exports = {
  loadAndSkipTour: function(client, wait) {
    normalizeViewport(client, 1000, 1024);
    client.url(client.globals.url)
      .execute(function() {
        return !(window.localStorage.getItem('hideSplash')); // See if there should be a tour
      }, [], function(result) {
        const hasTour = result.value;
        if (hasTour) {
          client.waitForElementVisible('#skipTour', wait, function() {
            client.click('#skipTour');
            client.pause(1000);
          });
        } else {
          client.waitForElementVisible('#wv-logo', wait);
        }
      });
  }
};
