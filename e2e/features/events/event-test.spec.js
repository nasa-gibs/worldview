// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { mockEvents } = require('../../test-utils/global-variables/querystrings')
const { closeModal } = require('../../test-utils/hooks/wvHooks')

/** @type {import('@playwright/test').Page} */
let page
/** @type {Record<string, import('@playwright/test').Locator>} */
let selectors
test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Make sure that 4 fire layers are not present in layer list: use mock', async () => {
  const { sidebarEvent, thermAnomSNPPday, thermAnomSNPPnight, thermAnomVIIRSday, thermAnomVIIRSnight } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await page.waitForTimeout(500)
  await expect(sidebarEvent).toBeVisible()
  await expect(thermAnomSNPPday).not.toBeVisible()
  await expect(thermAnomSNPPnight).not.toBeVisible()
  await expect(thermAnomVIIRSday).not.toBeVisible()
  await expect(thermAnomVIIRSnight).not.toBeVisible()
})

test('Check that 4 fire layers are now present', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'firefox cant find iceberg event sometimes')
  const { layersTab, sidebarEvent, thermAnomSNPPday, thermAnomSNPPnight, thermAnomVIIRSday, thermAnomVIIRSnight } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await page.waitForTimeout(1000)
  await sidebarEvent.click()
  await layersTab.click()
  await expect(thermAnomSNPPday).toBeVisible({ timeout: 10000 })
  await expect(thermAnomSNPPnight).toBeVisible({ timeout: 10000 })
  await expect(thermAnomVIIRSday).toBeVisible({ timeout: 10000 })
  await expect(thermAnomVIIRSnight).toBeVisible({ timeout: 10000 })
})

test('Use Mock to make sure appropriate number of event markers are appended to map', async () => {
  const { eventIcons, listOfEvents } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await expect(listOfEvents).toBeVisible()
  await expect(eventIcons).toHaveCount(8)
})
