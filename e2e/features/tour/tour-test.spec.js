// @ts-check
const { test } = require('@playwright/test')
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

test('Verify that all tour modals are present when the page is loaded', async () => {
  const { infoToolbarButton } = selectors
  await page.goto(skipTour)
  await infoToolbarButton.click()
  await page.locator('#start_tour_info_item').click()
})

test('Run tour', async () => {
  await page.locator('.tour-box:first-child').click()
  const stepsElement = await page.locator('.tour-in-progress .step-total')
  const stepsText = await stepsElement.textContent()
  const totalSteps = parseInt(stepsText)
  const nextStep = await page.locator('.step-container .step-next')
  for (let i = 0; i < totalSteps; i += 1) {
    await nextStep.click()
  }
  await page.locator('.tour-complete button.close')
})
