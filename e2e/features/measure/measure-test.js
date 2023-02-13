const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const { switchProjection } = require('../../reuseables/switch-projection')

const TIME_LIMIT = 10000

const {
  measureBtn,
  measureAreaBtn,
  measureDistanceBtn,
  clearMeasurementsBtn,
  measureMenu,
  measurementTooltip,
  geoMeasurementTooltip,
  arcticMeasurementTooltip,
  sidebarContainer,
  unitOfMeasureToggle,
  downloadGeojsonBtn
  // downloadShapefileBtn,
} = localSelectors

function createDistanceMeasurement (c, [startX, startY], [endX, endY]) {
  c.useCss().click(measureBtn)
  c.waitForElementVisible(measureMenu)
  c.useCss().click(measureDistanceBtn)
  c.pause(200)
  c.waitForElementVisible('#measurement-alert', TIME_LIMIT)
  c.perform(function () {
    const actions = this.actions({ async: true })

    return actions
      .move({
        origin: 'viewport',
        x: startX,
        y: startY
      })
      .click()
      .move({
        origin: 'pointer',
        x: endX,
        y: endY
      })
      .doubleClick()
  })
}

module.exports = {
  before (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.setWindowSize(1700, 1000)
  },
  'Clicking the measure button opens the menu': (c) => {
    c.expect.element(measureMenu).to.not.be.present
    c.useCss().click(measureBtn)
    c.waitForElementVisible(measureMenu, TIME_LIMIT)
    c.pause(300)
  },
  'Initiating a measurement causes an alert to show and sidebar to collapse': (c) => {
    c.useCss().click(measureDistanceBtn)
    c.waitForElementVisible('#measurement-alert', TIME_LIMIT)
    c.useCss().assert.elementPresent(sidebarContainer)
    c.useCss().assert.cssProperty(
      sidebarContainer,
      'max-height',
      '0px'
    )
    c.pause(300)
  },
  'Cancelling a measurement causes an alert to disappear and sidebar to expand': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') { // right click doesn't work in firefox
      return
    }
    c.perform(function () {
      const actions = this.actions({ async: true })
      return actions
        .move({
          origin: 'viewport',
          x: 200,
          y: 110
        })
        .contextClick()
    })
    c.pause(300)
    c.expect.element('#measurement-alert').to.not.be.present
    c.expect.element(sidebarContainer)
      .to.have.css('max-height').which.does.not.equal('0px')
  },
  'Creating a distance measurement causes a tooltip to show': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    createDistanceMeasurement(c, [400, 200], [450, 300])
    createDistanceMeasurement(c, [350, 250], [350, 220])
    c.waitForElementVisible(geoMeasurementTooltip, TIME_LIMIT)
    c.pause(500)
    c.expect.elements(geoMeasurementTooltip).count.to.equal(2)
  },
  'Creating a area measurement causes a tooltip to show': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.useCss().click(measureBtn)
    c.pause(500)
    c.waitForElementVisible(measureMenu, TIME_LIMIT, (el) => {
      c.useCss().click(measureAreaBtn)
      c.perform(function () {
        const actions = this.actions({ async: true })

        return actions
          .move({
            origin: 'viewport',
            x: 375,
            y: 225
          })
          .click()
          .move({
            origin: 'pointer',
            x: 400,
            y: 275
          })
          .click()
          .move({
            x: 450,
            y: 300
          })
          .doubleClick()
      })
      c.waitForElementVisible(geoMeasurementTooltip, TIME_LIMIT)
      c.expect.elements(geoMeasurementTooltip).count.to.equal(3)
    })
  },
  'Download as GeoJSON and Shapefile options available in menu': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(measureBtn)
    c.pause(500)
    c.waitForElementVisible(downloadGeojsonBtn)
    // c.waitForElementVisible(downloadShapefileBtn);
    c.click('.modal')
  },
  'Switching to arctic projection, no measurements show': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    switchProjection(c, 'arctic')
    c.expect.elements(arcticMeasurementTooltip).count.to.equal(0)
  },
  'Download as GeoJSON and Shapefile options NOT available in menu': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    c.click(measureBtn)
    c.expect.element(downloadGeojsonBtn).to.not.be.present
    // c.expect.element(downloadShapefileBtn).to.not.be.present;
    c.click('.modal')
  },
  'Creating measurements in arctic projection causes tooltips to show': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    createDistanceMeasurement(c, [500, 200], [650, 300])
    createDistanceMeasurement(c, [450, 350], [550, 220])
    c.waitForElementVisible(arcticMeasurementTooltip, TIME_LIMIT)
    c.expect.elements(arcticMeasurementTooltip).count.to.equal(2)
  },
  'Clearing a measurements removes all tooltips in this projection only': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox' ||
        c.options.desiredCapabilities.browserName === 'chrome') {
      return
    }
    c.useCss().click(measureBtn)
    c.waitForElementVisible(measureMenu, TIME_LIMIT, (el) => {
      c.useCss().click(clearMeasurementsBtn)
      c.expect.elements(arcticMeasurementTooltip).count.to.equal(0)
      c.expect.elements(geoMeasurementTooltip).count.to.equal(3)
    })
  },
  'Switching back to geographic projection, three measurements show again': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') { // c.elements() returns different values for firefox
      return
    }
    switchProjection(c, 'geographic')
    c.expect.elements(geoMeasurementTooltip).count.to.equal(3)
  },
  // TODO: Fix macOS chrome test
  'Toggling unit of measure updates the measurement value': async (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox' ||
        c.options.desiredCapabilities.browserName === 'chrome') {
      return
    }
    c.click(measureBtn)
    await c.waitForElementVisible(measureMenu, TIME_LIMIT)
    await c.click(unitOfMeasureToggle)
    c.pause(500)
    const tooltips = await c.elements('css selector', measurementTooltip)
    tooltips.forEach((element) => {
      c.elementIdText(element.ELEMENT, (elResult) => {
        const pass = elResult.value.includes('mi')
        c.assert.ok(pass)
      })
    })
  },
  'Clearing a measurements removes all tooltips': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox' ||
        c.options.desiredCapabilities.browserName === 'chrome') {
      return
    }
    c.waitForElementVisible(measureMenu)
    c.useCss().click(clearMeasurementsBtn)
    c.expect.elements(measurementTooltip).count.to.equal(0)
  },
  after (c) {
    c.end()
  }
}
