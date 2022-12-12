const { normalizeViewport } = require('./normalize-viewport.js')

module.exports = {
  loadAndSkipTour (c, wait) {
    normalizeViewport(c, 1024, 768)
    c.url(c.globals.url).execute(
      function () {
        let showModal
        try {
          if (window.localStorage) {
            showModal = !window.localStorage.getItem('hideTour')
          }
        } catch (error) {
          // If localStorage is disabled, tour modal does not show
          showModal = false
        }
        return showModal
      },
      [],
      function ({ value: showModal }) {
        if (showModal) {
          c.waitForElementVisible('.tour button.close', wait, () => {
            c.click('.tour button.close')
            c.pause(1000)
          })
        } else {
          c.waitForElementVisible('#wv-logo', wait)
        }
      }
    )
  }
}
