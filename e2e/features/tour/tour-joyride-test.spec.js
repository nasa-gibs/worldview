// @ts-check
const { test, expect } = require('@playwright/test')

let page

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterAll(async () => {
  await page.close()
})

test('Verify that all tour loads properly, Joyride beacon shows after progressing to Step 2', async () => {
  const queryString = 'http://localhost:3000/?tr=hurricane_dorian_september_joyride&mockTour=true'
  await page.goto(queryString)
  await page.locator('.step-container .step-next').click()
  await page.locator('#wv-map').click()
  const firstBeaconSelector = await page.locator('#react-joyride-step-0 .react-joyride__beacon')
  await expect(firstBeaconSelector).toBeVisible()
})

test('Clicking beacon shows the floater tooltip', async () => {
  // Get the dimensions of the page and click center of the page
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    }
  })
  const centerX = dimensions.width / 2
  const centerY = dimensions.height / 2
  await page.mouse.click(centerX, centerY)
  await page.getByRole('button', { name: 'Open the dialog' }).click()
  const tooltip = await page.locator('.react-joyride__tooltip')
  await expect(tooltip).toBeVisible()
})

test('Closing tooltip advances to next step', async () => {
  const tooltip = await page.locator('.react-joyride__tooltip')
  await page.locator('.react-joyride__tooltip > button').click()
  await page.locator('#react-joyride-step-1 .react-joyride__beacon').click()
  await expect(tooltip).toBeVisible()
})

test('Clicking next advances to next step', async () => {
  const tooltipTextEl = await page.locator('.react-joyride__tooltip > div > div').first()
  await page.locator('.react-joyride__tooltip div:nth-of-type(2) > button:nth-of-type(2)').click()
  await expect(tooltipTextEl).toContainText('THIS IS STEP 3')
})

test('Prev button goes back a step', async () => {
  const tooltipTextEl = await page.locator('.react-joyride__tooltip > div > div').first()
  await page.locator('.react-joyride__tooltip div:nth-of-type(2) > button:first-of-type').click()
  await expect(tooltipTextEl).toContainText('THIS IS STEP 2')
})

test('Closing tooltip on last step ends the Joyride', async () => {
  const tooltip = await page.locator('.react-joyride__tooltip')
  const anyBeacon = await page.locator('.react-joyride__beacon')
  await page.locator('.react-joyride__tooltip div:nth-of-type(2) > button:nth-of-type(2)').click()
  await page.locator('.react-joyride__tooltip div:nth-of-type(2) > button:nth-of-type(2)').click()
  await page.locator('.react-joyride__tooltip div:nth-of-type(2) > button:nth-of-type(2)').click()
  await expect(tooltip).not.toBeVisible()
  await expect(anyBeacon).not.toBeVisible()
})

test('Joyride resets when the Worldview tour is moved to a step with Joyride steps', async () => {
  await page.locator('.step-container .step-next').click()
  await page.locator('.step-container .step-previous').click()
  const firstBeaconSelector = await page.locator('#react-joyride-step-0 .react-joyride__beacon')
  await expect(firstBeaconSelector).toBeVisible()
})
