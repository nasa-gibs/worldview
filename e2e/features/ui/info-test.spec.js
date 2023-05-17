// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
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

test('Info toolbar is visible and contains valid menu items', async () => {
  const { infoToolbarButton } = selectors
  await page.goto(skipTour)
  const sendFeedback = await page.locator('#send_feedback_info_item')
  const startTour = await page.locator('#start_tour_info_item')
  const settingsInfo = await page.locator('#settings_info_item')
  const aboutInfo = await page.locator('#about_info_item')
  const distractionFree = await page.locator('#distraction_free_info_item')
  await expect(infoToolbarButton).toBeVisible()
  await infoToolbarButton.click()
  await expect(sendFeedback).toBeVisible()
  await expect(startTour).toBeVisible()
  await expect(settingsInfo).toBeVisible()
  await expect(aboutInfo).toBeVisible()
  await expect(distractionFree).toBeVisible()
})

test('About menu item opens about modal', async () => {
  await page.locator('#about_info_item').click()
  const aboutPage = await page.locator('.about-page')
  const contact = await page.locator('a[href="mailto:ryan.a.boller@nasa.gov"]')
  await expect(aboutPage).toBeVisible()
  await expect(contact).toBeVisible()
})
