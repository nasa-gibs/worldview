const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')
const localQueryStrings = require('../../reuseables/querystrings.js')

const TIME_LIMIT = 30000 // Sometimes takes a while to generate GIFs
// const askDialog = '.modal-body .notify'
// const paletteDialogOkButton = '#image_download_notify_palette .accept-notify'
const rotationDialogOkButton = '#image_download_notify_rotate .accept-notify'
const articeRotationResetButton = '.wv-map-reset-rotation'

module.exports = {
  before (client) {
    reuseables.loadAndSkipTour(client, TIME_LIMIT)
  },
  // TODO: Fix FireFox and Chrome test
  'Downloading GIF when custom colormap is activated': function (client) {
    if (client.options.desiredCapabilities.browserName !== 'ie' &&
      client.options.desiredCapabilities.browserName !== 'chrome' &&
      client.options.desiredCapabilities.browserName !== 'firefox') {
      // Custom colormaps down exist in IE
      client.url(client.globals.url + localQueryStrings.activeCustomColormap)
      client.waitForElementVisible(
        localSelectors.animationWidget,
        TIME_LIMIT,
        () => {
          client.click(localSelectors.createGifIcon).pause(2000)
          client.expect.element(askDialog).to.be.present
          client
            .useCss()
            .click(paletteDialogOkButton)
            .pause(2000)
          client.click(localSelectors.createGifButton).pause(2000)
          client.waitForElementVisible(
            localSelectors.gifResults,
            TIME_LIMIT,
            () => {
              client.click(client.globals.selectors.modalCloseButton)
              client.expect.element(localSelectors.gifResults).to.not.be
                .present
              client.waitForElementVisible(
                localSelectors.animationWidget,
                TIME_LIMIT
              )
            }
          )
        }
      )
    }
  },
  'Downloading GIF when polar projection is rotated': function (client) {
    client.url(
      client.globals.url + localQueryStrings.animationProjectionRotated
    )
    client.waitForElementVisible(
      localSelectors.animationWidget,
      TIME_LIMIT,
      () => {
        client.click(localSelectors.createGifIcon).pause(2000)
        client.useCss().assert.containsText(articeRotationResetButton, '-18')
        client
          .useCss()
          .click(rotationDialogOkButton)
          .pause(2000)
        client.useCss().assert.containsText(articeRotationResetButton, '0')
      }
    )
  },
  'GIF selection preview is Accurate and selections that are too high disable GIF download': function (
    client
  ) {
    client.url(client.globals.url + localQueryStrings.activeAnimationWidget)
    client.waitForElementVisible(
      localSelectors.animationWidget,
      TIME_LIMIT,
      () => {
        client.click(localSelectors.createGifIcon).pause(2000)
        client.waitForElementVisible(
          localSelectors.createGifButton,
          TIME_LIMIT,
          () => {
            client
              .useCss()
              .assert.containsText(
                localSelectors.gifPreviewStartDate,
                '2018 MAR 28'
              )
            client
              .useCss()
              .assert.containsText(
                localSelectors.gifPreviewEndDate,
                '2018 APR 04'
              )
            client
              .useCss()
              .assert.containsText(
                localSelectors.gifPreviewFrameRateValue,
                '3 Frames Per Second'
              )
            client.useCss().assert.containsText('.gif-max-size', '8200px')
            client.assert.ok('#wv-checkbox-gif') // checkbox is checked
            client
              .click(localSelectors.gifPreviewEndResolutionOption500)
              .pause(2000)
            client.assert.value(
              localSelectors.gifPreviewEndResolutionSelector,
              '2'
            )
            client.expect.element(localSelectors.gifDownloadButton).to.not.be
              .enabled
          }
        )
      }
    )
  },
  'GIF download is disabled when too many frames would be requested with standard interval': function (
    client
  ) {
    client.url(client.globals.url + localQueryStrings.animationTooManyFramesGif)
    client.waitForElementVisible(
      localSelectors.animationWidget,
      TIME_LIMIT,
      () => {
        client.useCss().assert.cssClassPresent('#create-gif-button', 'disabled')
      }
    )
  },
  'GIF download is disabled when too many frames would be requested with custom interval': function (
    client
  ) {
    client.url(client.globals.url + localQueryStrings.animationTooManyFramesGifCustomInterval)
    client.waitForElementVisible(
      localSelectors.animationWidget,
      TIME_LIMIT,
      () => {
        client.useCss().assert.cssClassPresent('#create-gif-button', 'disabled')
      }
    )
  },
  after (client) {
    client.end()
  }
}
