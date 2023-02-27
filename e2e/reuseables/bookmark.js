const TIME_LIMIT = 10000

module.exports = {
  bookmark (c, params) {
    const url = `${c.globals.url}?${params.join('&')}`
    c.url(url)
    c.waitForElementVisible('#wv-logo', TIME_LIMIT)
  }
}
