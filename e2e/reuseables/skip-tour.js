const normalizeViewport = require('./normalize-viewport.js').normalizeViewport;
module.exports = {
  loadAndSkipTour: function(client, wait) {
    normalizeViewport(client, 1024, 768);
    client.url(client.globals.url)
      .execute(function() {
        return !(window.localStorage.getItem('hideTour')); // See if there should be a tour
      }, [], function(result) {
        const hasTour = result.value;
        if (hasTour) {
          client.waitForElementVisible('.tour button.close', wait, function() {
            client.click('.tour button.close');
            client.pause(1000);
          });
        } else {
          client.waitForElementVisible('#wv-logo', wait);
        }
      });
  }
};
