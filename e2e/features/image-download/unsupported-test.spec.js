// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { closeModal } = require('../../test-utils/hooks/wvHooks')
const { joinUrl } = require('../../test-utils/hooks/basicHooks')

let page
let selectors
let notify
let cancelNotify
let acceptNotify
let toolbarSnapshot

const startParams = ['v=-180,-90,180,90', 't=2018-06-01', 'imageDownload=']

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
  notify = page.locator('.notify p')
  cancelNotify = page.locator('.cancel-notify')
  acceptNotify = page.locator('.accept-notify')
  toolbarSnapshot = page.locator('#toolbar_snapshot')
})

test.afterAll(async () => {
  await page.close()
})

test('Rotation is not supported dialog', async () => {
  const { snapshotToolbarButton } = selectors
  const url = await joinUrl(startParams, '&p=arctic&r=18')
  await page.goto(url)
  await closeModal(page)
  await snapshotToolbarButton.click()
  await expect(notify).toBeVisible()
})

test('Rotation: Cancel button', async () => {
  await cancelNotify.click()
  await expect(notify).not.toBeVisible()
  await expect(toolbarSnapshot).not.toBeVisible()
})

test('Rotation: OK button brings up download panel', async () => {
  const { snapshotToolbarButton } = selectors
  await snapshotToolbarButton.click()
  await expect(notify).toBeVisible()
  await acceptNotify.click()
  await expect(notify).not.toBeVisible()
  await expect(toolbarSnapshot).toBeVisible()
})
