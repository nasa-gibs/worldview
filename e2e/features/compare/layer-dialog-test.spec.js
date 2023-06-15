// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { swipeAOD } = require('../../test-utils/global-variables/querystrings')

let page
let selectors
let aerosolLayer
let AodOptionsPanelBody
let AodInfoPanel
let correctedReflectanceBLayer
let correctedReflectanceInfoPanel

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
  aerosolLayer = page.locator('#active-MODIS_Terra_Aerosol')
  AodOptionsPanelBody = page.locator('#layer_options_modal-modis_terra_aerosol .modal-body')
  AodInfoPanel = page.locator('.layer_info_modal-modis_terra_aerosol')
  correctedReflectanceBLayer = page.locator('#activeB-MODIS_Terra_CorrectedReflectance_TrueColor')
  correctedReflectanceInfoPanel = page.locator('#layer_info_modal-modis_terra_correctedreflectance_truecolor')
})

test.afterAll(async () => {
  await page.close()
})

test('Layer option features work in A|B mode', async () => {
  await page.goto(swipeAOD)
  await expect(AodOptionsPanelBody).not.toBeVisible()
  await aerosolLayer.hover()
  await page.locator('#active-MODIS_Terra_Aerosol .wv-layers-options').click()
  const modalTitle = page.locator('#layer_options_modal-modis_terra_aerosol .modal-header .modal-title')
  await expect(modalTitle).toHaveText('Aerosol Optical Depth')
  const paletteSelector = page.locator('#layer_options_modal-modis_terra_aerosol .modal-body .wv-palette-selector')
  await expect(paletteSelector).toBeVisible()
})

test('Layer info dialog work in A|B mode', async () => {
  await page.locator('.modal-close-btn').click()
  await aerosolLayer.hover()
  await page.locator('#layer-info-btn-MODIS_Terra_Aerosol').click()
  await expect(AodInfoPanel).toContainText('The Aerosol Optical Depth layer is useful for studying aerosol optical depth')
})

test('Expect clicking A|B button to close options dialog', async () => {
  const { compareButton } = selectors
  await page.locator('.modal-close-btn').click()
  await compareButton.click()
  await expect(AodOptionsPanelBody).not.toBeVisible()
})

test('Layer option features after exiting A|B mode', async () => {
  await aerosolLayer.hover()
  await page.locator('#active-MODIS_Terra_Aerosol .wv-layers-options').click()
  const title = page.locator('#layer_options_modal-modis_terra_aerosol .modal-header .modal-title')
  await expect(title).toContainText('Aerosol Optical Depth')
  const paletteSelector = page.locator('#layer_options_modal-modis_terra_aerosol .modal-body .wv-palette-selector')
  await expect(paletteSelector).toBeVisible()
})

test('Layer info dialog works after exiting A|B mode', async () => {
  await page.locator('.modal-close-btn').click()
  await aerosolLayer.hover()
  await page.locator('#layer-info-btn-MODIS_Terra_Aerosol').click()
  await expect(AodInfoPanel).toContainText('The Aerosol Optical Depth layer is useful for studying aerosol optical depth')
})

test('Expect reactivating A|B to close options dialog and activate B state', async () => {
  const { compareButton, bTab } = selectors
  await page.locator('.modal-close-btn').click()
  await aerosolLayer.hover()
  await page.locator('#active-MODIS_Terra_Aerosol .wv-layers-options').click()
  await page.locator('.modal-close-btn').click()
  await compareButton.click()
  await expect(AodOptionsPanelBody).not.toBeVisible()
  await bTab.click()
})

test('Layer option features work in B state', async () => {
  await expect(AodOptionsPanelBody).not.toBeVisible()
  await correctedReflectanceBLayer.hover()
  await page.locator('#activeB-MODIS_Terra_CorrectedReflectance_TrueColor .wv-layers-options').click()
  const title = page.locator('#layer_options_modal-modis_terra_correctedreflectance_truecolor .modal-header .modal-title')
  await expect(title).toContainText('Corrected Reflectance (True Color')
  const paletteSelector = page.locator('#layer_options_modal-modis_terra_correctedreflectance_truecolor .modal-body .wv-palette-selector')
  await expect(paletteSelector).not.toBeVisible()
})

test('Layer info dialog works after clicking into B mode', async () => {
  await page.locator('.modal-close-btn').click()
  await correctedReflectanceBLayer.hover()
  await page.locator('#activeB-MODIS_Terra_CorrectedReflectance_TrueColor .wv-layers-info').click()
  await expect(correctedReflectanceInfoPanel).toContainText('These images are called true-color or natural color because this combination of wavelengths is similar to what the human eye')
})
