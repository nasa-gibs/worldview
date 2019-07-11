module.exports = {
  zoomIn: function(c, proj) {
    c.click(`#wv-map [data-proj='${proj}'] div.wv-map-zoom-in`);
    c.pause(300);
  }
};
