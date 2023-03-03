// @ts-check
const { test, expect } = require('@playwright/test')
const { skipTour } = require('../../test-utils/global-variables/querystrings')

let page

const withinMapURLParams = 'http://localhost:3000/?v=-67.80916012733559,-56.052180562072095,-30.50743102883792,-30.873513420586164&t=2021-08-08-T0'
const crossesPrevDayURLParams = 'http://localhost:3000/?v=161.16767164758798,-54.46571918482002,198.46940074608565,-29.287052043334096&t=2021-08-08-T0'
const crossesNextDayURLParams = 'http://localhost:3000/?v=-198.76946733086245,-59.504883811673906,-161.46773823236478,-34.326216670187975&t=2021-08-08-T0'

const startParams = [
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  'v=-1,-1,1,1',
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

test('JPEG is the default', async () => {
  const url = `${skipTour}?${startParams.join('&')}`
  await page.goto(url)
  await page.locator('#wv-image-button').click()
  await page.locator('.wv-image-button').click()
  const imageDownloadUrl = await page.locator('#wv-image-download-url')
  const urlAttribute = await imageDownloadUrl.getAttribute('url')
  expect(urlAttribute).not.toContain('WORLDFILE')
  expect(urlAttribute).toContain('FORMAT=image/jpeg')
  await page.locator('#toolbar_snapshot .close').click()
})

test('Add a worldfile', async () => {
  await page.locator('#wv-image-button').click()
  const worldfile = await page.locator('#wv-image-worldfile')
  await worldfile.selectOption({ index: 1 })
  await page.locator('.wv-image-button').click()
  const imageDownloadUrl = await page.locator('#wv-image-download-url')
  const urlAttribute = await imageDownloadUrl.getAttribute('url')
  expect(urlAttribute).toContain('WORLDFILE=true')
  await worldfile.selectOption({ index: 0 })
  await page.locator('#toolbar_snapshot .close').click()
})

test('Select PNG', async () => {
  await page.locator('#wv-image-button').click()
  const imageFormat = await page.locator('#wv-image-format')
  await imageFormat.selectOption({ index: 1 })
  await page.locator('.wv-image-button').click()
  const imageDownloadUrl = await page.locator('#wv-image-download-url')
  const urlAttribute = await imageDownloadUrl.getAttribute('url')
  expect(urlAttribute).toContain('FORMAT=image/png')
  await page.locator('#toolbar_snapshot .close').click()
})