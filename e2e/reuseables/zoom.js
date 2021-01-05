module.exports = {
  zoomIn(c, proj) {
    c.click('button.wv-map-zoom-in');
    c.pause(300);
  },
};
