const { normalizeViewport } = require('../../reuseables/normalize-viewport.js')
const { localStorageEnabled } = require('../../reuseables/local-storage-check.js')
const localSelectors = require('../../reuseables/selectors.js')

const {
  infoToolbarButton
} = localSelectors

const TIME_LIMIT = 10000
const runTour = function (c) {
  let totalSteps
  c.waitForElementVisible('.tour-start', TIME_LIMIT)
  c.click('.tour-box:first-child')
  c.waitForElementVisible('.tour-in-progress .step-total', 2000)
  c.getText('.tour-in-progress .step-total', (result) => {
    totalSteps = parseInt(result.value, 10)
  })
    .perform(() => {
      for (let i = 0; i < totalSteps; i += 1) {
        c.pause(500)
        c.click('.step-container .step-next')
      }
    })
    .waitForElementVisible('.tour-complete button.close', 2000)
  c.click('.tour-complete button.close')
}

module.exports = {
  '@tags': ['localStorageDisabled'],
  before (c) {
    normalizeViewport(c, 1000, 850)
    c.url(c.globals.url)
  },
  'Verify that all tour modals are present when the page is loaded': function (c) {
    c.execute(
      localStorageEnabled,
      [],
      function ({ value }) {
        if (!value) {
          c.waitForElementVisible(infoToolbarButton, 2000)
          c.click(infoToolbarButton)
          c.waitForElementVisible('#start_tour_info_item', 1000)
          c.click('#start_tour_info_item')
          runTour(c)
        } else {
          runTour(c)
        }
      }
    )
  },
  after (c) {
    c.end()
  }
}
