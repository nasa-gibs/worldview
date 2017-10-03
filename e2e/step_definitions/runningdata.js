const {client} = require('nightwatch-cucumber');
const {defineSupportCode} = require('cucumber');

defineSupportCode(({Then}) => {

  Then('label says {string} when hovering at {int},{int}', (label, x, y) => {

    return client.useCss().moveToElement('.ol-viewport', x, y, ()=>{
      client.getText('.wv-running-label', function(result) {
        this.assert.equal(result.value, label);
      });
    });

  });

  Then('label says {string} when hovering on colorbar', (label) => {
    return client.getElementSize('.wv-palette .wv-palettes-colorbar', function(result) {
      var width = result.value.width;
      var height = result.value.height;
      client
        .useCss()
        .moveToElement('.wv-palette .wv-palettes-colorbar', width/2, height/2).click('.ol-viewport');
      client.getText('.wv-running-label', function(result) {
        this.assert.equal(result.value, label);
      });
    });
  });

});
