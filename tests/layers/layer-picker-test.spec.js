// @ts-check
const { test, expect } = require('@playwright/test')
const { check } = require('yargs')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { assertDefaultLayers, assertCategories } = require('../../test-utils/hooks/wvHooks')

let page
let selectors

const url = 'http://localhost:3000/?t=2013-05-15'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Layer picker shows categories when first opened', async () => {
  const { addLayers } = selectors
  await page.goto(url)
  await addLayers.click()
  await assertCategories(page)
})

test('Enabled Corrected Reflectance layers are shown as checked', async () => {
  const { allCategoryHeader, correctedReflectanceChecked } = selectors
  await allCategoryHeader.click()
  await page.locator('#accordion-legacy-all-corrected-reflectance').click()
  await expect(correctedReflectanceChecked).toBeVisible()
})

test('"Unavailable" layers show unavailable icon and tooltip', async () => {
  const { weldUnavailableTooltipIcon } = selectors
  await page.locator('#landsat-weld-1-source-Nav').click()
  await weldUnavailableTooltipIcon.hover()
  const tooltip = await page.locator('.tooltip')
  await expect(tooltip).toBeVisible()
})

test('Entering search text transitions to search mode', async () => {
  const { layersSearchField, layersSearchRow } = selectors
  await layersSearchField.fill('ozone')
  await expect(layersSearchRow).toHaveCount(6)
})

test('Updating input changes results', async () => {
  const { layersSearchField, layersSearchRow } = selectors
  await layersSearchField.clear()
  await layersSearchField.fill('ozone day')
  await expect(layersSearchRow).toHaveCount(1)
})

test('Selecting a row shows the detail panel', async () => {
  const { layerDetailHeader } = selectors
  await page.locator('#MLS_O3_46hPa_Day-search-row').click()
  await expect(layerDetailHeader).toBeVisible()
})

test('Add layer button and list item checbox are in sync', async () => {
  const { addToMapButton } = selectors
  const checkBox = await page.locator('.search-row.layers-all-layer.selected .wv-checkbox')
  await addToMapButton.click()
  await expect(checkBox).toHaveClass(/checked/)
  await expect(addToMapButton).toContainText('Remove Layer')
  await checkBox.click()
  await expect(addToMapButton).toContainText('Add Layer')
  await expect(checkBox).not.toHaveClass('checked')
})