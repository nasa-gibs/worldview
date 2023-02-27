// eslint-disable-next-line no-redeclare
const { URL } = require('url')

exports.assertion = function (parameter, value) {
  this.message = `Testing if URL parameter "${parameter}" has value: ${value}`
  this.expected = `${parameter}=${value}`
  this.pass = function (value) {
    const expected = this.expected.split('=')
    const expectedParam = expected[0]
    const expectedValue = expected[1]
    if (expectedValue === 'true') {
      return !!value.get(expectedParam)
    }
    return value.get(expectedParam) === expectedValue
  }
  this.value = function (result) {
    const url = new URL(result.value)
    return url.searchParams
  }
  this.command = function (cb) {
    this.api.url(cb)
    return this
  }
}
