// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')

let page
let selectors

const damsLayerUrl = 'http://localhost:3000/?v=-70.43215000968726,28.678203599725197,-59.81569241792232,31.62330063930118&l=GRanD_Dams,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor'
const damsLayerWMSZoomLevelUrl = 'http://localhost:3000/?v=-166.0537832499445,-8.893604135881553,79.78417648048394,59.303969410599414&l=GRanD_Dams,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Vector layer click does not show alert when all vector layers are clickable', async () => {
  const { geographicMap, notifyMessage } = selectors
  await page.goto(damsLayerUrl)
  const pointerIcon = await page.locator('#active-GRanD_Dams .fa-hand-pointer')
  await expect(pointerIcon).toBeVisible()
  await geographicMap.click()
  await expect(notifyMessage).not.toBeVisible()
})

test('Vectors show alert when not clickable', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'issue identifying pointer')
  const { geographicMap, notifyMessage } = selectors
  await page.goto(damsLayerWMSZoomLevelUrl)
  const pointerIcon = await page.locator('#active-GRanD_Dams .fa-hand-pointer')
  await expect(pointerIcon).toBeVisible()
  await geographicMap.click()
  await expect(notifyMessage).toBeVisible()
  await expect(notifyMessage).toContainText('Vector features may not be clickable at all zoom levels.')
})

test('Clicking vector message shows modal', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'issue identifying pointer')
  const { notifyMessage } = selectors
  await notifyMessage.click()
  const modalContent = await page.locator('.modal-content')
  await expect(modalContent).toContainText('Vector features may not be clickable at all zoom levels.')
})
