const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')

const {
  infoToolbarButton
} = localSelectors

const aboutOpenURL = 'http://localhost:3000/?abt=on'
const aboutClosedURL = 'http://localhost:3000/'

const TIME_LIMIT = 10000

module.exports = {
  beforeEach: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },

  'About modal not open when URL param not present': (c) => {
    c.url(aboutClosedURL)
    c.expect.element('.about-page').to.be.not.present
  },

  'Opening about modal from menu sets URL param': (c) => {
    c.click(infoToolbarButton)
    c.waitForElementVisible('#about_info_item', TIME_LIMIT)
    c.click('#about_info_item')
    c.waitForElementVisible('.about-page', TIME_LIMIT)
    c.expect.element('.about-page').to.be.present
    c.assert.urlParameterEquals('abt', 'on')
  },

  'About modal is open when URL param is present': (c) => {
    c.url(aboutOpenURL)
    c.expect.element('.about-page').to.be.present
  },

  after: (c) => {
    c.end()
  }
}
