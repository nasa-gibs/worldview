const { localStorageEnabled } = require('../../reuseables/local-storage-check.js')
const { addLayers } = require('../../reuseables/selectors.js')

// Local storage disabled
module.exports = {
  '@tags': ['localStorageDisabled'],
  before (c) {
    c.url(`${c.globals.url}?t=2020-07-04`)
  },
  'Verify that recent layers tab does not show when local storage is disabled': function (c) {
    c.execute(
      localStorageEnabled,
      [],
      function ({ value }) {
        if (!value) {
          c.click(addLayers)
          c.expect.element('.recent-tab').to.not.be.present
        }
      }
    )
  },
  after (c) {
    c.end()
  }
}
