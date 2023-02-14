/* eslint-disable object-shorthand */
module.exports = {
  checkElementOrdering: function (client, containerSelector, expectedOrderingArray) {
    const getElementId = (el) => {
      if (client.options.desiredCapabilities.browserName === 'firefox') {
        return el[Object.keys(el)[0]]
      }
      return el.ELEMENT
    }
    client.elements('css selector', containerSelector, (result) => {
      result.value.forEach((el, idx) => {
        const elementId = getElementId(el)
        const attribute = 'id'
        client.elementIdAttribute(elementId, attribute, ({ value }) => {
          client.assert.equal(value, expectedOrderingArray[idx], 'element ids match')
        })
      })
    })
  }
}
