// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { skipTour } = require('../../test-utils/global-variables/querystrings')

let page
let selectors

const aboutOpenURL = 'http://localhost:3000/?abt=on'
let aboutPage

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
  aboutPage = page.locator('.about-page')
})

test.afterAll(async () => {
  await page.close()
})

test('About modal not open when URL param not present', async () => {
  await page.goto(skipTour)
  await expect(aboutPage).not.toBeVisible()
})

test('Opening about modal from menu sets URL param', async () => {
  const { infoToolbarButton } = selectors
  await infoToolbarButton.click()
  await page.locator('#about_info_item').click()
  await expect(aboutPage).toBeVisible()
  const url = await page.url()
  expect(url).toContain('abt=on')
})

test('About modal is open when URL param is present', async () => {
  await page.goto(aboutOpenURL)
  await expect(aboutPage).toBeVisible()
})
