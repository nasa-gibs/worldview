const TIME_LIMIT = 10000;

// proj is either 'geographic', 'arctic', or 'antarctic'
module.exports = {
  switchProjection: function(client, proj) {
    const c = client;
    c.click('#wv-proj-button');
    c.waitForElementVisible(`#wv-proj-menu li[data-proj="${proj}"]`, TIME_LIMIT);
    c.click(`#wv-proj-menu li[data-proj="${proj}"]`);
    c.pause(1000);
  }
};
