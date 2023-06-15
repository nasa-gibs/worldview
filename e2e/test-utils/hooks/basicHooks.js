/**
 * Make selections for dropdown elements.
 * @param {Object} page - Playwright object representing the browser page.
 * @param {string} element - Class or id to identify the element
 * @param {integer} index - The index position of the selection you want to make
 */
const selectOption = async (page, element, index) => {
  const selectElement = await page.locator(element)
  await selectElement.selectOption({ index })
}

/**
 * Returns an element's specific attribute value to be tested agaisnt.
 * @param {Object} page - Playwright object representing the browser page.
 * @param {string} el - Class or id to identify the element
 * @param {string} attribute - The attribute ex: 'url'
 */
const getAttribute = async (page, el, attribute) => {
  const element = await page.locator(el)
  const elementAttribute = await element.getAttribute(attribute)
  return elementAttribute
}

/**
 * Returns a URL from an array of string parameters.
 * @param {Array} startParams - Array of strings each representing URL parameters.
 * @param {string|null} lastParam - String representing an interchangable url parameter.
 */
const joinUrl = async (startParams, lastParam) => {
  if (lastParam !== null) return `http://localhost:3000/?${startParams.join('&')}${lastParam}`
  return `http://localhost:3000/?${startParams.join('&')}`
}

/**
 * Clears an input and enters a new value.
 * @param {Object} page - Playwright object representing the browser page.
 * @param {string} inputElement - Class or id to identify the input element
 * @param {string} newValue - The value you want to enter as text to the input
 */
const clearAndChangeInput = async (page, inputElement, newValue) => {
  const input = page.locator(inputElement)
  await input.clear()
  await input.fill(newValue)
}

module.exports = {
  clearAndChangeInput,
  getAttribute,
  joinUrl,
  selectOption
}
