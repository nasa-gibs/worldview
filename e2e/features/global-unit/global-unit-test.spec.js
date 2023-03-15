// @ts-check
const { test, expect } = require('@playwright/test')

const SSTQueryString = 'http://localhost:3000/?l=GHRSST_L4_MUR_Sea_Surface_Temperature,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&lg=false&t=2020-09-28-T20%3A40%3A53Z'

let page
let globalSettingsModal
let settingContainer
let SSTMinPalette
let SSTMaxPalette
let kelvinButton

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  globalSettingsModal = page.locator('#global_settings_modal')
  settingContainer = page.locator('.global-setting-container')
  SSTMinPalette = page.locator('#GHRSST_L4_MUR_Sea_Surface_Temperature_GHRSST_Sea_Surface_Temperature_0_legend_0 > div.wv-palettes-min')
  SSTMaxPalette = page.locator('#GHRSST_L4_MUR_Sea_Surface_Temperature_GHRSST_Sea_Surface_Temperature_0_legend_0 > div.wv-palettes-max')
  kelvinButton = page.getByRole('button', { name: 'Kelvin' })
})

test.afterAll(async () => {
  await page.close()
})

test('Global settings menu item opens global settings modal', async () => {
  await page.goto(SSTQueryString)
  await page.getByRole('button', { name: 'Information' }).click()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(globalSettingsModal).toBeVisible()
  await expect(settingContainer).toBeVisible()
})

test('Initial temp unit is default value in layer palette legend', async () => {
  await expect(SSTMinPalette).toContainText('< 0.00 °C')
  await expect(SSTMaxPalette).toContainText('≥ 32.00 °C')
})

test('Selecting Kelvin unit changes unit being used in layer palette legend', async () => {
  await page.getByRole('button', { name: 'Kelvin' }).click()
  await expect(SSTMinPalette).toContainText('< 273.15 K')
  await expect(SSTMaxPalette).toContainText('≥ 305.15 K')
})

test('Kelvin global unit is retained via localStorage and active on new url', async () => {
  await page.goto(SSTQueryString)
  await page.getByRole('button', { name: 'Information' }).click()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(kelvinButton).toHaveClass(/active/)
  await expect(SSTMinPalette).toContainText('< 273.15 K')
  await expect(SSTMaxPalette).toContainText('≥ 305.15 K')
})
