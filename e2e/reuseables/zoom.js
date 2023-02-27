module.exports = {
  zoomIn (c) {
    c.click('button.wv-map-zoom-in')
    c.pause(300)
  },
  zoomOut (c) {
    c.click('button.wv-map-zoom-out')
    c.pause(300)
  }
}
