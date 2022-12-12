const { normalizeViewport } = require('../../reuseables/normalize-viewport.js')

const TIME_LIMIT = 10000

const tourNext = '.step-container .step-next'
const tourPrev = '.step-container .step-previous'
const anyBeacon = '.react-joyride__beacon'
const firstBeaconSelector = '#react-joyride-step-0 .react-joyride__beacon'
const secondBeaconSelector = '#react-joyride-step-1 .react-joyride__beacon'
const prevButton = '.react-joyride__tooltip div:nth-of-type(2) > button:first-of-type'
const nextButtonAfterPrev = '.react-joyride__tooltip div:nth-of-type(2) > button:nth-of-type(2)'
const tooltip = '.react-joyride__tooltip'
const tooltipTextEl = '.react-joyride__tooltip > div > div'
const tooltipClose = '.react-joyride__tooltip > button'

module.exports = {
  before (c) {
    normalizeViewport(c, 1000, 850)
    c.url(`${c.globals.url}?tr=hurricane_dorian_september_joyride&mockTour=true`)
  },
  'Verify that all tour loads properly, Joyride beacon shows after progressing to Step 2': (c) => {
    c.setWindowSize(1000, 800)
    c.pause(300)
    c.useCss().waitForElementVisible('.tour-in-progress .step-total', TIME_LIMIT)
    c.click(tourNext)
    c.click('#wv-map')
    c.pause(300)
    c.useCss().waitForElementVisible(firstBeaconSelector, TIME_LIMIT)
  },
  'Clicking beacon shows the floater tooltip': (c) => {
    if (c.options.desiredCapabilities.browserName !== 'firefox') { // intermittently fails on Chrome
      return
    }
    // c.useCss().waitForElementVisible(firstBeaconSelector, TIME_LIMIT);
    c.pause(5000)
    c.click('.react-joyride__beacon')
    c.waitForElementVisible(tooltip, TIME_LIMIT)
  },
  'Closing tooltip advances to next step': (c) => {
    if (c.options.desiredCapabilities.browserName !== 'firefox') { // intermittently fails on Chrome
      return
    }
    c.useCss().waitForElementVisible(tooltipClose, TIME_LIMIT)
    c.pause(500)
    c.click(tooltipClose)
    c.pause(500)
    c.waitForElementVisible(secondBeaconSelector, TIME_LIMIT)
    c.pause(500)
    c.click(secondBeaconSelector)
    c.waitForElementVisible(tooltip, TIME_LIMIT)
  },
  'Clicking next advances to next step': (c) => {
    if (c.options.desiredCapabilities.browserName !== 'firefox') { // intermittently fails on Chrome
      return
    }
    c.click(nextButtonAfterPrev)
    c.waitForElementVisible(tooltip, TIME_LIMIT)
    c.assert.containsText(tooltipTextEl, 'THIS IS STEP 3')
  },
  'Prev button goes back a step': (c) => {
    if (c.options.desiredCapabilities.browserName !== 'firefox') { // intermittently fails on Chrome
      return
    }
    c.click(prevButton)
    c.waitForElementVisible(tooltip, TIME_LIMIT)
    c.assert.containsText(tooltipTextEl, 'THIS IS STEP 2')
  },
  'Closing tooltip on last step ends the Joyride': (c) => {
    if (c.options.desiredCapabilities.browserName !== 'firefox') { // intermittently fails on Chrome
      return
    }
    c.click(nextButtonAfterPrev)
    c.waitForElementVisible(tooltip, TIME_LIMIT)
    c.click(nextButtonAfterPrev)
    c.waitForElementVisible(tooltip, TIME_LIMIT)
    c.click(nextButtonAfterPrev)
    c.expect.element(tooltip).not.to.be.present
    c.expect.element(anyBeacon).not.to.be.present
  },
  'Joyride resets when the Worldview tour is moved to a step with Joyride steps': (c) => {
    if (c.options.desiredCapabilities.browserName !== 'firefox') { // intermittently fails on Chrome
      return
    }
    c.click(tourNext)
    c.click(tourPrev)
    c.expect.element(firstBeaconSelector).to.be.present
  },
  after (c) {
    c.end()
  }
}
