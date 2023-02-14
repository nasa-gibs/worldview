const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const draggerA = '.timeline-dragger.draggerA '
const draggerB = '.timeline-dragger.draggerB '
const dateSelectorDayInput = '#date-selector-main .input-wrapper-day input'
const dateSelectorMonthInput = '#date-selector-main .input-wrapper-month input'
const TIME_LIMIT = 20000

module.exports = {
  before (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },
  // load A|B and verify that it is active
  'A|B is loaded': function (c) {
    c.url(c.globals.url + localQueryStrings.swipeAndAIsActive)
    c.waitForElementVisible(localSelectors.swipeDragger, TIME_LIMIT)
  },
  'Verify that A|B draggers are visible': function (c) {
    c.expect.element(draggerA).to.be.visible
    c.expect.element(draggerB).to.be.visible
  },
  'Dragging active dragger updates date': function (c) {
    c.assert.attributeContains(dateSelectorDayInput, 'value', '17')
    c.assert.attributeContains(dateSelectorMonthInput, 'value', 'AUG')
    c.perform(function () {
      const actions = this.actions({ async: true })
      const dragA = c.findElement(draggerA)
      return actions.dragAndDrop(dragA, { x: 100, y: 0 })
    })
    c.getValue(dateSelectorDayInput, (dayResult) => {
      c.getValue(dateSelectorMonthInput, function (monthResult) {
        const result = monthResult.value.concat(dayResult.value)
        this.assert.notEqual('AUG17', result)
      })
    })
  },
  'Clicking inactive dragger updates active state': function (c) {
    c.assert.hasClass(localSelectors.aTab, 'active')
    c.perform(function () {
      const actions = this.actions({ async: true })
      const dragB = c.findElement(draggerB)
      return actions
        .move({ origin: dragB })
        .click(dragB)
    })
    // Reference labels were not active in A but are in B
    c.waitForElementVisible(
      '#activeB-Reference_Features_15m',
      TIME_LIMIT,
      () => {
        c.assert.attributeContains(dateSelectorDayInput, 'value', '16')
      }
    )
  },
  'Dragging B dragger updates date in label': function (c) {
    c.useCss().assert.textContains(localSelectors.bTab, '2018 AUG 16')
    c.perform(function () {
      const actions = this.actions({ async: true })
      const dragB = c.findElement(draggerB)

      return actions.dragAndDrop(dragB, { x: 100, y: 0 })
    })
    c.getText(localSelectors.bTab, function (result) {
      this.assert.notEqual('B: 2018 AUG 16', result.value)
    })
  },
  'Deactivate A|B is no longer active': function (c) {
    c.click(localSelectors.compareButton)
    c.waitForElementNotPresent(
      localSelectors.bTab,
      TIME_LIMIT,
      () => {
        c
          .useCss()
          .assert.textContains(
            localSelectors.compareButton,
            'Start Comparison'
          )
        c.expect.element(draggerA).to.not.be.present
        c.expect.element(draggerB).to.be.visible
      }
    )
  },
  after (c) {
    c.end()
  }
}
