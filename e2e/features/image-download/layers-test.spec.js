// @ts-check
const { test, expect } = require('@playwright/test')
const { openImageDownloadPanel, clickDownload } = require('../../test-utils/hooks/wvHooks')
const { joinUrl, getAttribute } = require('../../test-utils/hooks/basicHooks')

let page

const startParams = [
  'v=-180,-90,180,90',
  't=2018-06-01',
  'imageDownload='
]

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterAll(async () => {
  await page.close()
})

test('List layers in draw order', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Features_15m,MODIS_Terra_Aerosol')
  await page.goto(url)
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor')
})

test('Move AOD over the reference features', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Reference_Features_15m')
  await page.goto(url)
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Features_15m,MODIS_Terra_Aerosol')
})

test('Do not include obscured layers', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Reference_Features_15m')
  await page.goto(url)
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor')
})

test('Multiple base layers when one is semi-transparent', async () => {
  const url = await joinUrl(startParams, '&l=MODIS_Terra_CorrectedReflectance_TrueColor(opacity=0.5),MODIS_Aqua_CorrectedReflectance_TrueColor')
  await page.goto(url)
  await openImageDownloadPanel(page)
  await clickDownload(page)
  const urlAttribute = await getAttribute(page, '#wv-image-download-url', 'url')
  expect(urlAttribute).toContain('LAYERS=MODIS_Aqua_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor')
  expect(urlAttribute).toContain('OPACITIES=,0.5')
})
