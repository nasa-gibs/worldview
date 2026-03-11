// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { assertCategories, closeModal } = require('../../test-utils/hooks/wvHooks')

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
  const { addLayers, collapsedLayerButton } = selectors
  await page.goto(url)
  await closeModal(page)
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

test('Swiping left removes a single recent layer', async () => {
  const aquaAerosolRow = page.locator('#MODIS_Aqua_Aerosol-search-row')
  const aodSearchRow = page.locator('#MODIS_Combined_Value_Added_AOD-search-row')
  const omiSearchRow = page.locator('#OMI_Aerosol_Optical_Depth-search-row')

  await expect(aquaAerosolRow).toBeVisible()

  const box = await aquaAerosolRow.boundingBox()
  expect(box).toBeTruthy()

  const startX = box.x + box.width - 10
  const endX = box.x + 10
  const y = box.y + box.height / 2

  await page.mouse.move(startX, y)
  await page.mouse.down()
  await page.mouse.move(endX, y, { steps: 12 })
  await page.mouse.up()

  await expect(aquaAerosolRow).not.toBeVisible()
  await expect(omiSearchRow).toBeVisible()
  await expect(aodSearchRow).toBeVisible()
})

test('Clear list button empties the entire list', async () => {
  await page.locator('#clear-recent-layers').click()
  const productList = await page.locator('.product-outer-list-case.layers-all')
  const noResults = await page.locator('.no-results')
  await expect(productList).not.toBeVisible()
  await expect(noResults).toBeVisible()
})
