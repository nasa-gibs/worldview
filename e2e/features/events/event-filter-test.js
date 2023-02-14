const reuseables = require('../../reuseables/skip-tour.js')
const { switchProjection } = require('../../reuseables/switch-projection')
const {
  fixedAppNow,
  wildfiresWithDates,
  backwardsCompatibleEventUrl
} = require('../../reuseables/querystrings.js')

const TIME_LIMIT = 10000
const layersTab = '#layers-sidebar-tab'
const eventsTab = '#events-sidebar-tab'
const filterIcons = '.filter-icons > .event-icon'
const dustHazeIcon = '.filter-icons > #filter-dust-and-haze'
const volcanoesIcon = '.filter-icons > #filter-volcanoes'
const wildfiresIcon = '.filter-icons > #filter-wildfires'
const filterDates = '.filter-dates'
const filterButton = '#event-filter-button'
const filterModal = '.event-filter-modal'
const filterModalApply = '#filter-apply-btn'
const filterModalCancel = '#filter-cancel-btn'
const eventList = '.wv-eventslist'
const startInput = {
  year: '#year-event-filter-start',
  month: '#month-event-filter-start',
  day: '#day-event-filter-start'
}
const endInput = {
  year: '#year-event-filter-end',
  month: '#month-event-filter-end',
  day: '#day-event-filter-end'
}
const dustSwitch = '#dustHaze-switch'
const manmadeSwitch = '#manmade-switch'
const seaLakeIceSwitch = '#seaLakeIce-switch'
const severeStormsSwitch = '#severeStorms-switch'
const snowSwitch = '#snow-switch'
const volcanoesSwitch = '#volcanoes-switch'
const watercolorSwitch = '#waterColor-switch'
const wildfiresSwitch = '#wildfires-switch'
const mapExtentFilterCheckbox = '#map-extent-filter'

const getSwitchToggle = (inputId) => `${inputId} + .react-switch-label`

const openFilterModal = (c) => {
  c.waitForElementVisible(eventList, TIME_LIMIT)
  c.click(filterButton)
  c.waitForElementVisible(filterModal, TIME_LIMIT)
}

const assertDateInputValues = (c, start, end) => {
  const [startYear, startMonth, startDay] = start.split('-')
  const [endYear, endMonth, endDay] = end.split('-')
  c.assert.value(startInput.year, startYear)
  c.assert.value(startInput.month, startMonth)
  c.assert.value(startInput.day, startDay)
  c.assert.value(endInput.year, endYear)
  c.assert.value(endInput.month, endMonth)
  c.assert.value(endInput.day, endDay)
}

module.exports = {
  before (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },
  'Default filtering includes last 120 days and all categories': (c) => {
    c.url(c.globals.url + fixedAppNow)
    c.waitForElementVisible(layersTab, TIME_LIMIT)
    c.click(eventsTab)
    c.expect.elements(filterIcons).count.to.equal(8)

    // Print dates to log for debugging purposes
    c.getElementProperty(filterDates, 'innerText', function (result) {
      console.log('result', result)
    })

    c.assert.containsText(filterDates, '2011 SEP 02 - 2011 DEC 31')
  },
  'Filter modal inputs are correct': (c) => {
    c.pause(3000)
    c.click(filterButton)
    c.waitForElementVisible(filterModal, TIME_LIMIT)
    assertDateInputValues(c, '2011-SEP-02', '2011-DEC-31')
    c.expect.element(dustSwitch).to.be.selected
    c.expect.element(manmadeSwitch).to.be.selected
    c.expect.element(seaLakeIceSwitch).to.be.selected
    c.expect.element(severeStormsSwitch).to.be.selected
    c.expect.element(snowSwitch).to.be.selected
    c.expect.element(volcanoesSwitch).to.be.selected
    c.expect.element(watercolorSwitch).to.be.selected
    c.expect.element(wildfiresSwitch).to.be.selected
    c.expect.element(mapExtentFilterCheckbox).to.not.be.selected
  },
  'URL params for categories, dates, and extent filtering are present': (c) => {
    c.assert.urlParameterEquals('e', 'true')
    c.assert.urlParameterEquals('efc', 'dustHaze,manmade,seaLakeIce,severeStorms,snow,volcanoes,waterColor,wildfires')
    c.assert.urlParameterEquals('efd', '2011-09-02,2011-12-31')
    c.assert.urlParameterEquals('efs', 'true')
  },

  'Loading from permalink sets all criteria properly': (c) => {
    c.url(c.globals.url + wildfiresWithDates)
    c.assert.urlParameterEquals('e', 'true')
    c.assert.urlParameterEquals('efc', 'wildfires')
    c.assert.urlParameterEquals('efd', '2020-01-16,2020-06-16')
    c.assert.urlParameterEquals('efs', 'false')

    // Check filter criteria summary in sidebar
    c.expect.elements(filterIcons).count.to.equal(1)
    c.expect.element(wildfiresIcon).to.be.present
    c.assert.containsText(filterDates, '2020 JAN 16 - 2020 JUN 16')
    c.waitForElementVisible(eventList, TIME_LIMIT)

    // Check filter modal
    c.click(filterButton)
    c.waitForElementVisible(filterModal, TIME_LIMIT)
    assertDateInputValues(c, '2020-JAN-16', '2020-JUN-16')
    c.expect.element(dustSwitch).to.not.be.selected
    c.expect.element(manmadeSwitch).to.not.be.selected
    c.expect.element(seaLakeIceSwitch).to.not.be.selected
    c.expect.element(severeStormsSwitch).to.not.be.selected
    c.expect.element(snowSwitch).to.not.be.selected
    c.expect.element(volcanoesSwitch).to.not.be.selected
    c.expect.element(watercolorSwitch).to.not.be.selected
    c.expect.element(wildfiresSwitch).to.be.selected
    c.expect.element(mapExtentFilterCheckbox).to.be.selected
  },

  'Changing criteria in modal DOES NOT update summary of criteria in sidebar on CANCEL': (c) => {
    c.url(c.globals.url + wildfiresWithDates)
    openFilterModal(c)
    c.click(startInput.year).sendKeys(startInput.year, 2000)
    c.click(startInput.month).sendKeys(startInput.month, 'APR')
    c.click(startInput.day).sendKeys(startInput.day, 19)
    c.click(endInput.year).sendKeys(endInput.year, 2001)
    c.click(endInput.month).sendKeys(endInput.month, 'NOV')
    c.click(endInput.day).sendKeys(endInput.day, 11)
    c.click(getSwitchToggle(wildfiresSwitch)) // OFF
    c.pause(250)
    c.click(getSwitchToggle(dustSwitch)) // ON
    c.pause(250)
    c.click(getSwitchToggle(volcanoesSwitch)) // ON
    c.pause(250)
    c.click(mapExtentFilterCheckbox) // OFF

    // Cancel
    c.click(filterModalCancel)

    // assert sidebar values
    c.assert.containsText(filterDates, '2020 JAN 16 - 2020 JUN 16')
    c.expect.elements(filterIcons).count.to.equal(1)
    c.expect.element(wildfiresIcon).to.be.present // ON
  },
  'Opening modal after cancelling changed values shows previous unchanged values': (c) => {
    openFilterModal(c)
    assertDateInputValues(c, '2020-JAN-16', '2020-JUN-16')
    c.expect.element(dustSwitch).to.not.be.selected
    c.expect.element(manmadeSwitch).to.not.be.selected
    c.expect.element(seaLakeIceSwitch).to.not.be.selected
    c.expect.element(snowSwitch).to.not.be.selected
    c.expect.element(volcanoesSwitch).to.not.be.selected
    c.expect.element(watercolorSwitch).to.not.be.selected
    c.expect.element(wildfiresSwitch).to.be.selected // ON
    c.expect.element(mapExtentFilterCheckbox).to.be.selected
  },
  'Changing criteria in modal DOES update summary of criteria in sidebar on APPLY': (c) => {
    c.click(startInput.year).sendKeys(startInput.year, 2000)
    c.click(startInput.month).sendKeys(startInput.month, 'APR')
    c.click(startInput.day).sendKeys(startInput.day, 19)
    c.click(endInput.year).sendKeys(endInput.year, 2001)
    c.click(endInput.month).sendKeys(endInput.month, 'NOV')
    c.click(endInput.day).sendKeys(endInput.day, 11)
    c.click(getSwitchToggle(wildfiresSwitch)) // OFF
    c.pause(250)
    c.click(getSwitchToggle(dustSwitch)) // ON
    c.pause(250)
    c.click(getSwitchToggle(volcanoesSwitch)) // ON
    c.pause(250)
    c.click(mapExtentFilterCheckbox) // OFF

    // APPLY
    c.click(filterModalApply)

    // Print dates to log for debugging purposes
    c.getElementProperty(filterDates, 'innerText', function (result) {
      console.log('result', result)
    })

    // assert sidebar values
    c.assert.containsText(filterDates, '2000 APR 19 - 2001 NOV 11')
    c.expect.elements(filterIcons).count.to.equal(2)
    c.expect.element(dustHazeIcon).to.be.present // ON
    c.expect.element(volcanoesIcon).to.be.present // ON
    c.expect.element(wildfiresIcon).to.not.be.present // OFF
  },

  'Event Selected, No Filter Params: Shows only day of event, all categories, checkbox unchecked': (c) => {
    // TODO limit category to only the event category?
    c.url(c.globals.url + backwardsCompatibleEventUrl)
    c.assert.containsText(filterDates, '2005 DEC 31 - 2005 DEC 31')
    openFilterModal(c)
    assertDateInputValues(c, '2005-DEC-31', '2005-DEC-31')
    c.expect.elements(filterIcons).count.to.equal(8)
    c.expect.element(mapExtentFilterCheckbox).to.not.be.selected
    c.click(filterModalCancel)
  },

  'No extent search checkbox in polar projections': (c) => {
    c.url(`${c.globals.url}?e=true&efs=false`)

    openFilterModal(c)
    c.expect.element(mapExtentFilterCheckbox).to.be.present
    c.expect.element(mapExtentFilterCheckbox).to.be.selected
    c.click(filterModalCancel)

    switchProjection(c, 'arctic')
    openFilterModal(c)
    c.expect.element(mapExtentFilterCheckbox).to.not.be.present
    c.click(filterModalCancel)

    switchProjection(c, 'geographic')
    openFilterModal(c)
    c.expect.element(mapExtentFilterCheckbox).to.be.present
    c.expect.element(mapExtentFilterCheckbox).to.be.selected
    c.click(filterModalCancel)

    switchProjection(c, 'antarctic')
    openFilterModal(c)
    c.expect.element(mapExtentFilterCheckbox).to.not.be.present
    c.click(filterModalCancel)
  },
  after (c) {
    c.end()
  }
}
