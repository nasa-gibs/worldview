// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { openImageDownloadPanel } = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')

let page
let selectors

const startParams = [
  'p=geographic',
  'v=-180,-90,180,90',
  'l=MODIS_Terra_CorrectedReflectance_TrueColor',
  't=2018-06-01',
  'imageDownload='
]

const defaultCoords = '180.0000'
const selectedCoords = '28.1250'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Verify that global select is present and not selected', async () => {
  const { globalSelectInput } = selectors
  const url = await joinUrl(startParams, null)
  await page.goto(url)
  await openImageDownloadPanel(page)
  await expect(globalSelectInput).toBeVisible()
  await expect(globalSelectInput).not.toBeChecked()
})

test('Verify that checking checkbox updates bounding-box labels', async () => {
  const { globalSelectInput, bboxTopCoords, bboxBottomCoords } = selectors
  await expect(bboxTopCoords).not.toContainText(defaultCoords)
  await globalSelectInput.click()
  await expect(bboxTopCoords).toContainText(defaultCoords)
  await expect(bboxBottomCoords).toContainText(defaultCoords)
})

test('Verify that unchecking checkbox updates bounding-box to previous', async () => {
  const { globalSelectInput, bboxTopCoords, bboxBottomCoords } = selectors
  await globalSelectInput.click()
  await expect(bboxTopCoords).not.toContainText(defaultCoords)
  await expect(bboxTopCoords).toContainText(selectedCoords)
  await expect(bboxBottomCoords).toContainText(selectedCoords)
})
