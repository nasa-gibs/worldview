// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')

let page
let selectors

const mockAlertQuery = 'http://localhost:3000/?mockAlerts='
const layerNoticesQuery = 'http://localhost:3000/?l=Coastlines_15m,MODIS_Aqua_CorrectedReflectance_TrueColor,Particulate_Matter_Below_2.5micrometers_2001-2010'

let infoButtonIcon
let infoMenu
let notificationsListItem
let tooltipSelector

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
  infoButtonIcon = page.locator('#wv-info-button svg.svg-inline--fa')
  infoMenu = page.locator('#toolbar_info')
  notificationsListItem = page.locator('#notifications_info_item .fa-circle-exclamation')
  tooltipSelector = page.locator('.tooltip-inner div')
})

test.afterAll(async () => {
  await page.close()
})

test('No visible notifications with mockAlert parameter set to no_types', async () => {
  const url = `${mockAlertQuery}no_types`
  const giftListItem = await page.locator('#toolbar_info li.gift')
  const boltListItem = await page.locator('#toolbar_info li.bolt')
  await page.goto(url)
  await infoButtonIcon.click()
  await expect(infoMenu).not.toContainText('Notifications')
  await expect(giftListItem).not.toBeVisible()
  await expect(boltListItem).not.toBeVisible()
})

test('Outage takes precedence when all three notifications are present', async () => {
  const url = `${layerNoticesQuery}&mockAlerts=all_types`
  const statusOutage = await page.locator('#wv-info-button.wv-status-outage')
  await page.goto(url)
  await expect(statusOutage).toBeVisible()
  await infoButtonIcon.click()
  await expect(infoMenu).toContainText('Notifications')
  await expect(notificationsListItem).toBeVisible()
})

test('Verify that layer notices don\'t show up in the notification list or contribute to the count', async () => {
  const badge = await page.locator('span.badge')
  await expect(badge).toBeVisible()
  await expect(badge).toContainText('3')
})

test('Alert, outage, and message content is highlighted and found in modal', async () => {
  const outageContentHighlighted = await page.locator('#notification_list_modal .outage-notification-item span')
  const alertContentHighlighted = await page.locator('#notification_list_modal .alert-notification-item p')
  const messageContentHighlighted = await page.locator('#notification_list_modal .message-notification-item p')
  await notificationsListItem.click()
  await expect(outageContentHighlighted).toContainText('Posted 20 May 2018')
  await expect(alertContentHighlighted).toContainText('learn how to visualize global satellite imagery')
  await expect(messageContentHighlighted).toContainText('This is a message test')
})

test('Verify that the user is only alerted if they have not already stored all items in localStorage', async () => {
  const hideButton = await page.locator('#wv-info-button.wv-status-hide')
  await page.locator('.modal-close-btn').click()
  await expect(hideButton).toBeVisible()
})

test('Verify that zots show for the layers that have notices', async () => {
  const aquaZot = await page.locator('#MODIS_Aqua_CorrectedReflectance_TrueColor-zot')
  const particulateZot = await page.locator('#Particulate_Matter_Below_2__2E__5micrometers_2001-2010-zot')
  await expect(aquaZot).toBeVisible()
  await aquaZot.hover()
  const aquaNotice = tooltipSelector.first()
  const multiNotice = tooltipSelector.last()
  await expect(aquaNotice).toContainText('The Aqua / MODIS Corrected Reflectance (True Color) layer is currently unavailable.')
  await expect(multiNotice).toContainText('Several layers are experiencing delays in processing.')
  await expect(particulateZot).toBeVisible()
  await particulateZot.hover()
  const tooltip = await page.locator('.tooltip-inner div div').first()
  await expect(tooltip).toContainText('Several layers are experiencing delays in processing.')
})

test('Verify that warning shows in the product picker category/measurement rows', async () => {
  const { addLayers } = selectors
  await addLayers.click()
  await page.locator('#layer-category-item-air-quality-corrected-reflectance').click()
  await page.locator('#checkbox-case-MODIS_Aqua_CorrectedReflectance_TrueColor').hover()
  const aquaNotice = tooltipSelector.first()
  const multiNotice = tooltipSelector.last()
  await expect(aquaNotice).toContainText('The Aqua / MODIS Corrected Reflectance (True Color) layer is currently unavailable.')
  await expect(multiNotice).toContainText('Several layers are experiencing delays in processing.')
})

test('Verify that warning shows in the product picker search results rows', async () => {
  const { layersSearchField } = selectors
  await layersSearchField.fill('MODIS_Aqua_CorrectedReflectance_TrueColor')
  await page.locator('.layer-notice-icon').hover()
  const aquaNotice = tooltipSelector.first()
  const multiNotice = tooltipSelector.last()
  await expect(aquaNotice).toContainText('The Aqua / MODIS Corrected Reflectance (True Color) layer is currently unavailable.')
  await expect(multiNotice).toContainText('Several layers are experiencing delays in processing.')
})
