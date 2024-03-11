// @ts-check
const { test, expect } = require('@playwright/test')
let page

const floodOnlyGrayUrl = 'http://localhost:3000/?l=MODIS_Combined_Flood_2-Day(disabled=3-0)&lg=true&t=2023-12-07-T18%3A49%3A23Z'
const floodGrayAndBlueUrl = 'http://localhost:3000/?l=MODIS_Combined_Flood_2-Day(disabled=3-1)&lg=true&t=2023-12-07-T18%3A49%3A23Z'
const floodAllColorsUrl = 'http://localhost:3000/?v=40.26574028225701,22.7438297693855,53.256765605078826,33.4181513838979&l=MODIS_Combined_Flood_2-Day&lg=true&t=2023-01-07-T18%3A49%3A23Z'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterAll(async () => {
  await page.close()
})

test('Flood 2 Day only Gray', async () => {
  await page.goto(floodOnlyGrayUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(3000)

  await expect(page).toHaveScreenshot('only-gray.png', {
    fullPage: true,
    threshold: 0.2
  })
})

test('Flood 2 Day Gray & Blue', async () => {
  await page.goto(floodGrayAndBlueUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(3000)

  await expect(page).toHaveScreenshot('gray-and-blue.png', {
    fullPage: true,
    threshold: 0.2
  })
})

test('Flood 2 Day All Colors', async () => {
  await page.goto(floodAllColorsUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(3000)

  await expect(page).toHaveScreenshot('all-colors.png', {
    fullPage: true,
    threshold: 0.2
  })
})
