const { normalizeViewport } = require('../../reuseables/normalize-viewport.js')
const { localStorageEnabled } = require('../../reuseables/local-storage-check.js')

module.exports = {
  '@tags': ['localStorageDisabled', 'skipLocalStorageEnabled'],
  before (c) {
    normalizeViewport(c, 1000, 850)
    c.url(c.globals.url)
  },
  'Verify tour modal does not display when local storage disabled': function (c) {
    c.execute(
      localStorageEnabled,
      [],
      function (result) {
        if (result.value) {
          throw new Error('Local storage enabled for test that expected disabled.')
        }
        // eslint-disable-next-line no-console
        console.log('Local storage disabled')
        c.assert.not.elementPresent('.tour-start')
      }
    )
  },
  after (c) {
    c.end()
  }
}
