const localQueryStrings = require('../../reuseables/querystrings.js')

const TIME_LIMIT = 10000

module.exports = {
  before: (c) => {
    c.url(c.globals.url + localQueryStrings.knownDate)
    c.pause(1000)
    c.setWindowSize(375, 667)
    c.pause(1000)
  },

  'Mobile animate button opens widget': (c) => {
    c.waitForElementVisible('.mobile-animate-button', TIME_LIMIT)
    c.useCss().click('.mobile-animate-button')
    c.pause(500)
    c.waitForElementPresent('#wv-animation-widget', TIME_LIMIT)
    c.expect.element('.custom-interval-delta-input').to.have.value.that.equals('1')
    c.expect.element('.dropdown-toggle').text.to.equal('DAY')
  },

  'Minimizing mobile animation widget opens collapsed animation widget': (c) => {
    c.useCss().click('#mobile-animation-close')
    c.waitForElementVisible('#collapsed-animate-widget-phone-portrait', TIME_LIMIT)
  },

  'Playing the animation changes the date of the mobile date picker': (c) => {
    c.useCss().click('#collapsed-animate-widget-phone-portrait')
    // this pause is the minimum amount of time needed to load & play the animation on a throttled connection
    c.pause(20000)
    c.expect.element('.mobile-date-picker-select-btn-text span').text.to.equal('2019 AUG 01')
  },

  'Pressing the animation button brings up the mobile animation widget with the same information': (c) => {
    c.useCss().click('.mobile-animate-button')
    c.pause(500)
    c.waitForElementVisible('#wv-animation-widget', TIME_LIMIT)
    c.expect.element('#mobile-animation-start-date .mobile-date-picker-select-btn span').text.to.equal('2019 JUL 22')
    c.expect.element('#mobile-animation-end-date .mobile-date-picker-select-btn span').text.to.equal('2019 AUG 01')
  },

  after (c) {
    c.end()
  }
}
