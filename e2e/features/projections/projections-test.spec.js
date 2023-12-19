// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { switchProjections } = require('../../test-utils/hooks/wvHooks')
const { skipTour } = require('../../test-utils/global-variables/querystrings')

let page
let selectors

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Verify default page shows projection toolbar button in geographic projection map', async () => {
  const { projToolbarButton, geographicMap } = selectors
  await page.goto(skipTour)
  await expect(projToolbarButton).toBeVisible()
  await expect(geographicMap).toBeVisible()
})

test('Verify changing projection to arctic switches map to arctic', async () => {
  if (process.env.SOTO === 'true') {
    test.skip(true, '2nd Polar change is hidden by something: <iframe src="about:blank" id="react-refresh-overlay"></iframe> intercepts pointer events')
  }
  const { arcticMap } = selectors
  await switchProjections(page, 'arctic')
  await expect(arcticMap).toBeVisible()
})

test('Verify changing projection to antarctic switches map to antarctic', async () => {
  if (process.env.SOTO === 'true') {
    test.skip(true, '2nd Polar change is hidden by something: <iframe src="about:blank" id="react-refresh-overlay"></iframe> intercepts pointer events')
  }
  const { antarcticMap } = selectors
  await switchProjections(page, 'antarctic')
  await expect(antarcticMap).toBeVisible()
})
