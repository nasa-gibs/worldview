const { localStorageEnabled } = require('../../reuseables/local-storage-check.js')
const { addLayers, collapsedLayerButton } = require('../../reuseables/selectors.js')

// Local storage disabled
module.exports = {
  '@tags': ['localStorageDisabled'],
  before (c) {
    c.url(`${c.globals.url}?t=2020-07-04`)
    c.setWindowSize(375, 667) // iPhone 6/7/8 dimensions
  },
  'Verify that recent layers dropdown choice does not show when local storage is disabled': function (c) {
    c.execute(
      localStorageEnabled,
      [],
      function ({ value }) {
        if (!value) {
          c.click(collapsedLayerButton)
          c.click(addLayers)
          c.waitForElementVisible('.categories-dropdown-header', 5000, () => {
            c.click('.categories-dropdown-header .dropdown-toggle')
            c.expect.elements('.categories-dropdown-item').count.to.equal(3)
            c.expect.element('.categories-dropdown-item:nth-of-type(1)').text.not.contains('Recent')
            c.expect.element('.categories-dropdown-item:nth-of-type(2)').text.not.contains('Recent')
            c.expect.element('.categories-dropdown-item:nth-of-type(3)').text.not.contains('Recent')
          })
        }
      }
    )
  },
  after (c) {
    c.end()
  }
}
