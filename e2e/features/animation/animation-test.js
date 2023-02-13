const reuseables = require('../../reuseables/skip-tour.js')
const localQueryStrings = require('../../reuseables/querystrings.js')
const {
  dragger,
  animationWidget,
  animationButton,
  playButton,
  animateYearUp,
  animateYearDown,
  yearStartInput,
  monthStartInput,
  dayStartInput,
  hourStartInput,
  minuteStartInput,
  yearEndInput,
  monthEndInput,
  dayEndInput,
  hourEndInput,
  minuteEndInput,
  animationIntervalSelector,
  animationFrameSlider
} = require('../../reuseables/selectors.js')

const TIME_LIMIT = 10000
module.exports = {
  '@tags': ['localStorageDisabled'],
  beforeEach (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },

  'Clicking the animation widget button opens the widget': (c) => {
    c.waitForElementVisible(dragger, TIME_LIMIT, (el) => {
      c.expect.element(animationWidget).to.not.be.present
      c.useCss().click(animationButton)
      c.waitForElementVisible(animationWidget, TIME_LIMIT)
    })
  },

  'Opening custom interval widget': (c) => {
    c.url(c.globals.url + localQueryStrings.activeAnimationWidget)
    c.waitForElementVisible(
      animationButton,
      TIME_LIMIT,
      (el) => {
        c
          .useCss()
          .moveToElement('.wv-animation-widget-header #timeline-interval-btn-container #current-interval', 1, 1)
          .waitForElementVisible('.wv-animation-widget-header .timeline-interval .interval-years', 2000)
          .click('.wv-animation-widget-header .timeline-interval #interval-custom-static')
        c.pause(300)
        c.useCss().assert.elementPresent('#wv-animation-widget .custom-interval-widget')
        c.useCss().assert.containsText('.wv-animation-widget-header #current-interval', '1 DAY')
        c.useCss().assert.containsText('#timeline #current-interval', '1 DAY')
      }
    )
  },

  'Changing date range of animation via timeline dragger': (c) => {
    c.url(c.globals.url + localQueryStrings.activeAnimationWidget)
    // Test Permalink opens widget
    c.waitForElementVisible(
      '#day-animation-widget-start',
      TIME_LIMIT,
      (el) => {
        c.getValue('#day-animation-widget-start', (result) => {
          const startDay = result
          c
            .useCss()
            .moveToElement(
              '#wv-timeline-range-selector > g:nth-child(2) > rect',
              1,
              1
            )
            .mouseButtonDown(0)
            .moveToElement('.timeline-dragger', 0, 0)
            .mouseButtonUp(0)
            .pause(2000)
          c.getValue('#day-animation-widget-start', (result) => {
            const newDay = result
            c.assert.notEqual(startDay, newDay)
          })
        })
      }
    )
  },

  'Changing animation time interval': (c) => {
    // Can't use moveToElement twice with same elements
    // because of selenium catching.
    // Loading a different Url fixed the problem
    // https://github.com/SeleniumHQ/selenium/issues/4724#issuecomment-330862710
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.useCss().click(animationButton)
    c.waitForElementVisible(
      animationButton,
      TIME_LIMIT,
      (el) => {
        c
          .useCss()
          .moveToElement('.wv-animation-widget-header #timeline-interval-btn-container #current-interval', 1, 1)
          .waitForElementVisible('.wv-animation-widget-header .timeline-interval .interval-years', 2000)
          .click('.wv-animation-widget-header #timeline-interval #interval-years')
        c.pause(1000)
        c.useCss().assert.containsText('.wv-animation-widget-header #current-interval', '1 YEAR')
        c.useCss().assert.containsText('#timeline #current-interval', '1 YEAR')
      }
    )
  },

  'Disable when playing': (c) => {
    c.url(c.globals.url + localQueryStrings.animationGeostationary)
    c.waitForElementVisible(animationButton, TIME_LIMIT)
    c.click(playButton)
    c.pause(1000)
    c.assert.attributeEquals(yearStartInput, 'disabled', 'true')
    c.assert.attributeEquals(yearEndInput, 'disabled', 'true')
    c.assert.attributeEquals(monthStartInput, 'disabled', 'true')
    c.assert.attributeEquals(monthEndInput, 'disabled', 'true')
    c.assert.attributeEquals(dayStartInput, 'disabled', 'true')
    c.assert.attributeEquals(dayEndInput, 'disabled', 'true')
    c.assert.attributeEquals(hourStartInput, 'disabled', 'true')
    c.assert.attributeEquals(hourEndInput, 'disabled', 'true')
    c.assert.attributeEquals(minuteStartInput, 'disabled', 'true')
    c.assert.attributeEquals(minuteEndInput, 'disabled', 'true')
    c.assert.cssClassPresent(animationFrameSlider, 'rc-slider-disabled')
    c.assert.cssClassPresent(animationIntervalSelector, 'disabled')
    c.click(playButton)
  },

  'Disable playback when max frames exceeded': (c) => {
    c.url(c.globals.url + localQueryStrings.animationGeostationary)
    c.click(animateYearDown)
    c.pause(500)
    c.assert.cssClassPresent(playButton, 'disabled')

    // Playback re-enabled when frames within the max
    c.click(animateYearUp)
    c.pause(500)
    c.assert.not.cssClassPresent(playButton, 'disabled')

    // App should not freeze when dates roll over
    c.click(animateYearUp)
    c.pause(500)
    c.assert.value(yearStartInput, '1948')
    c.assert.cssClassPresent(playButton, 'disabled')
  },

  after (c) {
    c.end()
  }
}
