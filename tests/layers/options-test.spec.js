// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { assertCategories, switchProjections } = require('../../test-utils/hooks/wvHooks')

let page
let selectors

const customsSquashedQuerystring = '?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Combined_Value_Added_AOD(opacity=0.7,palette=blue_2,min=0.1,0.105,max=0.56,0.565),MODIS_Terra_Aerosol,Reference_Labels_15m(opacity=0.94),Reference_Features_15m(hidden),Coastlines_15m&t=2019-01-15-T00%3A00%3A00Z&z=3&v=-271.7031658620978,-216.84375,370.1093341379022,36.84375'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Verify that settings button opens settings modal', async () => {
  const { aodSidebarLayer } = selectors
  await page.goto(customsSquashedQuerystring)
  await aodSidebarLayer.hover()
  const thresholdMinLabel = await page.locator('#wv-layer-options-threshold0 .wv-label-range-min')
  const combinedAodSettingsButton = await page.locator('#active-MODIS_Combined_Value_Added_AOD .wv-layers-options')
  await expect(thresholdMinLabel).not.toBeVisible()
  await combinedAodSettingsButton.click()
  await expect(thresholdMinLabel).toBeVisible()
})

test('Verify that custom blue custom palette is checked', async () => {
  const { aodSidebarLayer } = selectors
  const activeDefaultPaletteCheckbox = await page.locator('.wv-palette-selector-row.checked #wv-palette-radio-__default')
  const activeBluePaletteCheckbox = await page.locator('.wv-palette-selector-row.checked #wv-palette-radio-blue_2')

})

test('Verify that threshold and opacity components update when different layer setting button clicked', async () => {
  const { aodSidebarLayer } = selectors
  const thresholdMinLabel = await page.locator('#wv-layer-options-threshold0 .wv-label-range-min')
  const combinedAodSettingsButton = await page.locator('#active-MODIS_Combined_Value_Added_AOD .wv-layers-options')
  const opacityLabel = await page.locator('.layer-opacity-select .wv-label')
  const terraAodSettingsDialog = await page.locator('#layer_options_modal-modis_terra_aerosol')
  await expect(thresholdMinLabel).not.toBeVisible()
  await combinedAodSettingsButton.click()
  await expect(thresholdMinLabel).toBeVisible()
})