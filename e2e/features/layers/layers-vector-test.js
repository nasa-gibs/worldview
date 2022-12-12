const skipTour = require('../../reuseables/skip-tour.js')

const damsLayerQuerystring = '?v=-70.43215000968726,28.678203599725197,-59.81569241792232,31.62330063930118&l=GRanD_Dams,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor'
const damsLayerWMSZoomLevelQuerystring = '?v=-166.0537832499445,-8.893604135881553,79.78417648048394,59.303969410599414&l=GRanD_Dams,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor'

const TIME_LIMIT = 10000

module.exports = {
  before: (c) => {
    skipTour.loadAndSkipTour(c, TIME_LIMIT)
  },
  'vector layer has pointer icon': (c) => {
    c.url(c.globals.url + damsLayerQuerystring)
    c.waitForElementVisible('#active-GRanD_Dams .fa-hand-pointer', TIME_LIMIT)
  },
  'vector layer click does not show alert when all vector layers are clickable': (c) => {
    const globalSelectors = c.globals.selectors

    c.moveToElement('#wv-map-geographic', 400, 200)
      .mouseButtonClick(0)
    c.pause(200)
    c.expect.element(globalSelectors.notifyMessage).to.not.be.present
  },
  'Vectors show alert when not clickable': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    const globalSelectors = c.globals.selectors

    c.url(c.globals.url + damsLayerWMSZoomLevelQuerystring)
    c.waitForElementVisible('#active-GRanD_Dams .fa-hand-pointer', TIME_LIMIT, () => {
      c.moveToElement('#wv-map-geographic', 400, 200)
        .click('#wv-map-geographic')
      c.pause(300)
      c.expect.element(globalSelectors.notifyMessage).to.be.present
      c.assert.containsText(
        globalSelectors.notifyMessage,
        'Vector features may not be clickable at all zoom levels.'
      )
    })
  },
  'clicking vector message shows modal': (c) => {
    if (c.options.desiredCapabilities.browserName === 'firefox') {
      return
    }
    const globalSelectors = c.globals.selectors

    c.click(globalSelectors.notifyMessage)
    c.waitForElementVisible('.modal-content', TIME_LIMIT, () => {
      c.assert.containsText('.modal-content',
        'Vector features may not be clickable at all zoom levels.')
    })
  },

  // TODO tests for orbit tracks toggle on/off
  after: (c) => {
    c.end()
  }
}
