// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { skipTour } = require('../../test-utils/global-variables/querystrings')

let page
let selectors

const markerUrl = 'http://localhost:3000/?v=-176.3167432493038,-16.70650759975561,-16.988618249303812,108.30938074294103&s=-77.032,38.8904'
const removeMarkerUrl = 'http://localhost:3000/?v=-39.980778604772254,-93.78047406661956,48.73858468999798,-50.229432449264905&s=10,-75'
const invalidMarkerQuery = 'http://localhost:3000/?s=-51.5,invalidtext'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Location Search component is visible by default', async () => {
  const { locationSearchComponent } = selectors
  await page.goto(skipTour)
  await expect(locationSearchComponent).toBeVisible()
})

test('Clicking the minimize button minimizes the Location Search component', async () => {
  const { locationSearchComponent, locationSearchMinimizeButton } = selectors
  await locationSearchMinimizeButton.click()
  await expect(locationSearchComponent).not.toBeVisible()
})

test('Location Search component remains hidden on subsequent page loads per user preference', async () => {
  const { locationSearchComponent } = selectors
  await page.goto(skipTour)
  await expect(locationSearchComponent).not.toBeVisible()
})

test('Clicking Location Search toolbar button expands the Location Search component', async () => {
  const { locationSearchComponent, locationSearchToolbarButton } = selectors
  await locationSearchToolbarButton.click()
  await expect(locationSearchComponent).toBeVisible()
})

test('Coordinates dialog for permalink marker is visible by default on page load', async () => {
  const testMarkerEncodedID = await page.locator('.coordinates-map-marker_-77__2E__032__2C__38__2E__8904')
  await page.goto(markerUrl)
  await expect(testMarkerEncodedID).toBeVisible()
})

test('Coordinates title and detailed coordinates are correct', async () => {
  const { tooltipCoordinates, tooltipCoordinatesTitle } = selectors
  await expect(tooltipCoordinatesTitle).toContainText('Washington, District of Columbia')
  await expect(tooltipCoordinates).toContainText('38.8904°, -77.0320°')
})

test('Clicking minimize tooltip hides the coordinates dialog', async () => {
  const { tooltipCoordinatesMinimizeButton, tooltipCoordinatesContainer } = selectors
  await tooltipCoordinatesMinimizeButton.click()
  await expect(tooltipCoordinatesContainer).not.toBeVisible()
})

test('Clicking close tooltip removes the marker and coordinates dialog', async () => {
  const { coordinatesMapMarker, tooltipCoordinatesCloseButton } = selectors
  await page.goto(removeMarkerUrl)
  await tooltipCoordinatesCloseButton.click()
  await expect(coordinatesMapMarker).not.toBeVisible()
  const url = await page.url()
  expect(url).not.toContain('s=')
})

test('Invalid marker query string parameter prevents state update', async () => {
  const { coordinatesMapMarker } = selectors
  await page.goto(invalidMarkerQuery)
  await expect(coordinatesMapMarker).not.toBeVisible()
  const url = await page.url()
  expect(url).not.toContain('s=')
})
