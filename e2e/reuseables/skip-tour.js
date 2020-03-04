const { normalizeViewport } = require('./normalize-viewport.js');

module.exports = {
  loadAndSkipTour(client, wait) {
    normalizeViewport(client, 1024, 768);
    client.url(client.globals.url)
      .execute(() => !(window.localStorage.getItem('hideTour')) // See if there should be a tour
        , [], (result) => {
          const hasTour = result.value;
          if (hasTour) {
            client.waitForElementVisible('.tour button.close', wait, () => {
              client.click('.tour button.close');
              client.pause(1000);
            });
          } else {
            client.waitForElementVisible('#wv-logo', wait);
          }
        });
  }
};
