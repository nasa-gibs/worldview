const skipTour = require('../../reuseables/skip-tour.js')

const mobileDatePickerSelectBtn = '.mobile-date-picker-select-btn'
const nextDayArrowContainer = '#right-arrow-group'
const datepickerHeader = '.datepicker .datepicker-header'
const TIME_LIMIT = 10000

const { datePickerWheel } = require('../../reuseables/selectors.js')

module.exports = {
  before: (c) => {
    skipTour.loadAndSkipTour(c, TIME_LIMIT)
    c.url(`${c.globals.url}?now=2013-03-15T0`)
    c.setWindowSize(375, 667) // iPhone 6/7/8 dimensions
  },
  'date.mob.init.2a: Before 3:00 UTC: load yesterdays date': (c) => {
    c.waitForElementVisible(mobileDatePickerSelectBtn, TIME_LIMIT, (e) => {
      c.assert.containsText(mobileDatePickerSelectBtn, '2013 MAR 14')
    })
  },
  'date.mob.init.2b: Before 3:00 UTC: right button is not disabled': (c) => {
    c.expect.element(nextDayArrowContainer).to.be.present
    c.expect.element(`${nextDayArrowContainer}.button-disabled`).to.not.be.present
    c.click(nextDayArrowContainer)
    c.waitForElementVisible(`${nextDayArrowContainer}.button-disabled`, TIME_LIMIT)
  },
  'date.mob.init.3a: After 3:00 UTC: load todays date': (c) => {
    c.url(`${c.globals.url}?now=2013-03-15T4`)
    c.waitForElementVisible(mobileDatePickerSelectBtn, TIME_LIMIT, (e) => {
      c.assert.containsText(mobileDatePickerSelectBtn, '2013 MAR 15')
    })
  },
  'date.mob.init.3b:After 3:00 UTC: right button is disabled': (c) => {
    c.expect.element(nextDayArrowContainer).to.be.present
    c.expect.element(`${nextDayArrowContainer}.button-disabled`).to.be.present
  },
  'date.mob.range.1: Date label should show 2013-07-20': (c) => {
    c.url(`${c.globals.url}?now=2013-03-15T12`)
    c.waitForElementVisible(mobileDatePickerSelectBtn, TIME_LIMIT, (e) => {
      c.assert.containsText(mobileDatePickerSelectBtn, '2013 MAR 15')
    })
  },
  'date.mob.range.2: mobile selector header should show 2013 MAR 15': (c) => {
    c.click(mobileDatePickerSelectBtn)
    c.waitForElementVisible(datepickerHeader, TIME_LIMIT, (e) => {
      c.assert.containsText(datepickerHeader, '2013 MAR 15')
    })
  },
  'date.mob.range.3: Date label should show 2012 MAR 15 after year drag': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.perform(function () {
      const actions = this.actions({ async: true })
      const wheel = c.findElement(datePickerWheel)
      return actions
        .pause(300)
        .move({ origin: wheel })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
    })
    c.pause(300)
    c.useCss()
    c.assert.containsText(datepickerHeader, '2012 MAR 15')
  },
  'date.mob.range.4: Date in header should be 2012 JAN 15 after month drag': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.perform(function () {
      const actions = this.actions({ async: true })
      const wheel = c.findElement(datePickerWheel)
      return actions
        .pause(300)
        .move({
          origin: wheel,
          x: 100,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
        .pause(300)
        .move({
          origin: wheel,
          x: 100,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
    })
    c.pause(300)
    c.useCss()
    c.assert.containsText(datepickerHeader, '2012 JAN 15')
  },
  'date.mob.range.5: Date in header should be 2012 JAN 19 after day drag': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.perform(function () {
      const actions = this.actions({ async: true })
      const wheel = c.findElement(datePickerWheel)

      return actions
        .pause(300)
        .move({
          origin: wheel,
          x: 275,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: -40
        })
        .pause(300)
        .release()
        .pause(300)
        .move({
          origin: wheel,
          x: 275,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: -40
        })
        .pause(300)
        .release()
        .pause(300)
        .move({
          origin: wheel,
          x: 275,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: -40
        })
        .pause(300)
        .release()
        .pause(300)
        .move({
          origin: wheel,
          x: 275,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: -40
        })
        .pause(300)
        .release()
        .pause(300)
    })
    c.pause(800)
    c.useCss()
    c.assert.containsText(datepickerHeader, '2012 JAN 19')
  },
  'date.mob.range.6: Click okay button verify date has updated': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.useXpath().click("//a[text()='OK']")
    c.pause(300)
    c.useCss()
    c.assert.containsText(mobileDatePickerSelectBtn, '2012 JAN 19')
  },
  'date.mob.nav.1: Date label should show 2013 JUL 20': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.url(`${c.globals.url}?now=2014-03-15&t=2013-07-20T12`)
    c.waitForElementVisible(mobileDatePickerSelectBtn, TIME_LIMIT, (e) => {
      c.assert.containsText(mobileDatePickerSelectBtn, '2013 JUL 20')
    })
  },
  'date.mob.nav.2a: mobile selector header should show 2013 JUL 20': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(mobileDatePickerSelectBtn)
    c.waitForElementVisible(datepickerHeader, TIME_LIMIT, (e) => {
      c.assert.containsText(datepickerHeader, '2013 JUL 20')
    })
  },
  'date.mob.nav.2b: Year 2014 should be disabled and 2013 is not': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.waitForElementVisible(datepickerHeader, TIME_LIMIT, () => {
      c.useXpath() // https://github.com/nightwatchjs/nightwatch/issues/633#issuecomment-222968466
      c.expect.element("//li[contains(@class, 'disabled') and text()='2014']").to.be.present
      c.expect.element("//li[contains(@class, 'disabled') and text()='2013']").to.not.be.present
      c.expect.element("//li[text()='2013']").to.be.present
      c.useCss()
    })
  },
  'date.mob.nav.3: Date in header should be 2013 FEB 20 after year drag': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.pause(500)
    c.perform(function () {
      const actions = this.actions({ async: true })
      const wheel = c.findElement(datePickerWheel)
      return actions
        .pause(300)
        .move({
          origin: wheel,
          x: 100,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
        .pause(300)
        .move({
          origin: wheel,
          x: 100,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
        .pause(300)
        .move({
          origin: wheel,
          x: 100,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
        .pause(300)
        .move({
          origin: wheel,
          x: 100,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
        .pause(300)
        .move({
          origin: wheel,
          x: 100,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
    })
    c.pause(300)
    c.useCss()
    c.assert.containsText(datepickerHeader, '2013 FEB 20')
  },
  'date.mob.nav.4: Date label should show 2014 FEB 20 after year drag': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.perform(function () {
      const actions = this.actions({ async: true })
      const wheel = c.findElement(datePickerWheel)
      return actions
        .pause(300)
        .move({
          origin: wheel
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: -40
        })
        .pause(300)
        .release()
    })
    c.pause(300)
    c.useCss()
    c.assert.containsText(datepickerHeader, '2014 FEB 20')
  },
  'date.mob.nav.5: Date in header should be 2013 DEC 20 after year drag': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.perform(function () {
      const actions = this.actions({ async: true })
      const wheel = c.findElement(datePickerWheel)
      return actions
        .pause(300)
        .move({
          origin: wheel,
          x: 100,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
        .pause(300)
        .move({
          origin: wheel,
          x: 100,
          y: 0
        })
        .pause(300)
        .press()
        .pause(300)
        .move({
          origin: 'pointer',
          x: 0,
          y: 40
        })
        .pause(300)
        .release()
    })
    c.pause(300)
    c.useCss()
    c.assert.containsText(datepickerHeader, '2013 DEC 20')
  },
  'date.mob.nav.6: Click okay button verify date has updated to 2013 DEC 20': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.useXpath().click("//a[text()='OK']")
    c.pause(300)
    c.useCss()
    c.assert.containsText(mobileDatePickerSelectBtn, '2013 DEC 20')
  },
  after: (c) => {
    c.end()
  }
}
