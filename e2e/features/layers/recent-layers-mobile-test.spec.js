// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { assertCategories } = require('../../test-utils/hooks/wvHooks')

let page
let selectors

const url = 'http://localhost:3000/?t=2020-07-04'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  })
  page = await context.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Layer picker shows categories when first opened', async () => {
  const { collapsedLayerButton, addLayers } = selectors
  await page.goto(url)
  await collapsedLayerButton.click()
  await addLayers.click()
  await assertCategories(page)
})

test('Select several layers', async () => {
  const { layersSearchField, layerPickerBackButton } = selectors
  await layersSearchField.fill('aod')
  await page.locator('#MODIS_Aqua_Aerosol-checkbox').click()
  await page.locator('#MODIS_Combined_Value_Added_AOD-checkbox').click()
  await page.locator('#OMI_Aerosol_Optical_Depth-checkbox').click()
  await layerPickerBackButton.click()
})

test('Recent tab shows layers that were selected', async () => {
  await page.locator('.categories-dropdown-header .dropdown-toggle').click()
  await page.locator('.categories-dropdown-item:nth-of-type(4)').click()
  const aquaAerosolRow = await page.locator('#MODIS_Aqua_Aerosol-search-row')
  const aodSearchRow = await page.locator('#MODIS_Combined_Value_Added_AOD-search-row')
  const omiSearchRow = await page.locator('#OMI_Aerosol_Optical_Depth-search-row')
  await expect(aquaAerosolRow).toBeVisible()
  await expect(omiSearchRow).toBeVisible()
  await expect(aodSearchRow).toBeVisible()
})

test('Clear list button empties the entire list', async () => {
  await page.locator('#clear-recent-layers').click()
  const productList = await page.locator('.product-outter-list-case.layers-all')
  const noResults = await page.locator('.no-results')
  await expect(productList).not.toBeVisible()
  await expect(noResults).toBeVisible()
})
