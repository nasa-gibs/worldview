const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const {
  animationButtonCase,
  animationWidget,
  dataDownloadTabButton,
  eventsSidebarTabButton,
  snapshotToolbarButton,
  swipeDragger
} = localSelectors

const ModisTrueColorLayerA = '#active-MODIS_Terra_CorrectedReflectance_TrueColor'
const ModisTrueColorLayerB = '#activeB-MODIS_Terra_CorrectedReflectance_TrueColor'
const toggleButton = '#toggleIconHolder'
const collapsedToggleButton = '#accordion-toggler-button'
const tooltipSelector = '.tooltip-inner'

const TIME_LIMIT = 10000
module.exports = {
  before (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },
  // load A|B and verify that it is active
  'A|B is loaded': (c) => {
    c.url(c.globals.url + localQueryStrings.swipeAndAIsActive)
    c.waitForElementVisible(swipeDragger, TIME_LIMIT)
    c.pause(1000)
  },

  'Animation is disabled when compare mode active': (c) => {
    const disableMessage = 'Animation feature is deactivated when Compare feature is active'
    c.assert.hasClass(animationButtonCase, 'wv-disabled-button')
    c.assert.attributeContains(animationButtonCase, 'aria-label', disableMessage)
    c.moveToElement(animationButtonCase, 5, 5)
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT, (e) => {
      c.assert.containsText(tooltipSelector, disableMessage)
    })

    // Clicking does not activate animation
    c.click(animationButtonCase)
    c.expect.element(animationWidget).to.not.be.present
  },

  'Image download is disabled when compare mode active': (c) => {
    const disableMessage = 'You must exit comparison mode to use the snapshot feature'
    c.assert.hasClass(snapshotToolbarButton, 'disabled')
    c.assert.attributeContains(snapshotToolbarButton, 'aria-label', disableMessage)
    c.click('#snapshot-btn-wrapper')
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT, (e) => {
      c.assert.containsText(tooltipSelector, disableMessage)
    })

    // Clicking does not activate image download
    c.click(snapshotToolbarButton)
    c.pause(100)
    c.expect.element('#wv-image-resolution').to.not.be.present
  },

  'Data download is disabled when compare mode active': (c) => {
    const disableMessage = 'You must exit comparison mode to download data'
    c.assert.cssClassPresent(dataDownloadTabButton, 'disabled')
    c.assert.attributeContains(dataDownloadTabButton, 'aria-label', disableMessage)
    c.moveToElement('#download-sidebar-tab', 10, 10)
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT, (e) => {
      c.assert.containsText(tooltipSelector, disableMessage)
    })

    // Clicking does not switch tabs
    c.click(dataDownloadTabButton)
    c.pause(100)
    c.expect.element('#smart-handoff-side-panel').to.not.be.present
  },

  'Events disabled when compare mode active': (c) => {
    const disableMessage = 'You must exit comparison mode to use the natural events feature'

    c.moveToElement(eventsSidebarTabButton, 1, 1)
    c.click(eventsSidebarTabButton)
    c.pause(100)
    c.expect.element('#wv-eventscontent').to.not.be.present
    c.assert.cssClassPresent(eventsSidebarTabButton, 'disabled')
    c.assert.attributeContains(eventsSidebarTabButton, 'aria-label', disableMessage)
    c.moveToElement('#events-sidebar-tab', 10, 10)
    c.waitForElementVisible(tooltipSelector, TIME_LIMIT, (e) => {
      c.assert.containsText(tooltipSelector, disableMessage)
    })
  },

  'Removing layer removes correct layer from correct layer group': (c) => {
    c.expect.element(ModisTrueColorLayerA).to.be.visible
    c.moveToElement(ModisTrueColorLayerA, 1, 1).pause(200)
    c.click('#close-activeMODIS_Terra_CorrectedReflectance_TrueColor')
    c.pause(100)
    c.expect.element(ModisTrueColorLayerA).to.not.be.present
    c.expect.element(ModisTrueColorLayerB).to.not.be.present
    c.click(localSelectors.bTab)
    c.waitForElementVisible(ModisTrueColorLayerB, TIME_LIMIT)
  },

  /**
   * B state can layer list collapse
   */
  'Collapse layer list with B state and test label shows correct number of layers': (c) => {
    c.url(c.globals.url + localQueryStrings.spyAndBIsActive)

    c.waitForElementVisible(toggleButton, TIME_LIMIT, () => {
      c.expect.element(collapsedToggleButton).to.not.be.present
      c.click(toggleButton)
      c.pause(100)
      c.expect.element(collapsedToggleButton).to.be.present
      c.waitForElementNotPresent(toggleButton, TIME_LIMIT)
      c.useCss().assert.containsText(`${collapsedToggleButton} .layer-count`, '6')
      c.click(collapsedToggleButton)
      c.pause(100)
      c.waitForElementVisible('#activeB-Reference_Features_15m', TIME_LIMIT)
    })
  },

  /**
   * Remove some layers from active state B and then toggle out of A|B mode to verify
   * that layer-sidebar inherits B state layers
   */
  'If you exit A|B with B selection active, the active state will then be the B state': (c) => {
    c.expect.element('#activeB-VIIRS_SNPP_CorrectedReflectance_TrueColor')
      .to.be.visible
    c.expect.element('#activeB-MODIS_Aqua_CorrectedReflectance_TrueColor')
      .to.be.visible

    c.moveToElement('#activeB-Reference_Labels_15m', 1, 1).pause(200)
    c.click('#close-activeBReference_Labels_15m')

    c.moveToElement('#activeB-Reference_Features_15m', 1, 1).pause(200)
    c.click('#close-activeBReference_Features_15m')

    c.moveToElement('#activeB-VIIRS_SNPP_CorrectedReflectance_TrueColor', 1, 1).pause(200)
    c.click('#close-activeBVIIRS_SNPP_CorrectedReflectance_TrueColor')

    c.moveToElement('#activeB-MODIS_Aqua_CorrectedReflectance_TrueColor', 1, 1).pause(200)
    c.click('#close-activeBMODIS_Aqua_CorrectedReflectance_TrueColor')

    c.pause(500)
    c.click(localSelectors.compareButton)
    c.waitForElementNotPresent(
      '.timeline-dragger.draggerA',
      TIME_LIMIT,
      () => {
        c.expect.element('#activeB-Coastlines_15m').to.be.visible
        c.expect.element(
          '#activeB-MODIS_Terra_CorrectedReflectance_TrueColor'
        ).to.be.visible
        c.expect.element(
          '#activeB-VIIRS_SNPP_CorrectedReflectance_TrueColor'
        ).to.not.be.present
        c.expect.element(
          '#activeB-MODIS_Aqua_CorrectedReflectance_TrueColor'
        ).to.not.be.present
      }
    )
  },

  after (c) {
    c.end()
  }
}
