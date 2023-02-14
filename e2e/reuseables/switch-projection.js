const TIME_LIMIT = 10000

// proj is either 'geographic', 'arctic', or 'antarctic'
module.exports = {
  switchProjection (client, proj) {
    const c = client
    c.click('#wv-proj-button')
    c.waitForElementVisible(`#change-${proj}-button`, TIME_LIMIT)
    c.pause(500)
    c.click(`#change-${proj}-button`)
    c.waitForElementVisible(`#wv-map-${proj}`, TIME_LIMIT)
  }
}
