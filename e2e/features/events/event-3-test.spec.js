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

test('Verify that Url is updated', async () => {
  await page.goto(mockEvents)
  await closeModal(page)
  const currentUrl = await page.url()
  expect(currentUrl).toContain('efs=true')
  expect(currentUrl).toContain('efa=false')
  expect(currentUrl).toContain('lg=false')
})

test('Verify Events message and clicking message opens dialog', async () => {
  const { firstEvent, notifyMessage } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await page.waitForTimeout(500)
  await expect(firstEvent).toBeVisible()
  await firstEvent.click()
  await expect(notifyMessage).toBeVisible()
  await expect(notifyMessage).toContainText('Events may not be visible at all times.')
  await notifyMessage.click()
  await expect(page.locator('#event_visibility_info h1')).toContainText('Why can’t I see an event?')
  await closeModal(page)
  await expect(page.locator('#event_visibility_info')).not.toBeVisible()
  await page.locator('#event-alert-close').click()
  await expect(page.locator('.wv-alert .close-alert .fa-times')).not.toBeVisible()
})

test('Clicking selected event deselects event', async () => {
  const { firstEvent, selectedFirstEvent, eventsTab } = selectors
  await page.goto(mockEvents)
  await closeModal(page)
  await page.waitForTimeout(500)
  await expect(firstEvent).toBeVisible()
  await firstEvent.click()
  await selectedFirstEvent.click()
  await eventsTab.hover()
  await expect(selectedFirstEvent).not.toBeVisible()
})
