// @ts-check
/* These tests take a screenshots & compare the image output to an existing reference image in the /classification-test.spec.js-snapshots directory. There are reference images for various platforms.
toHaveScreenshot() will create a reference image if it doesn't already exist. So, if you need to
generate any new reference images simply delete the old ones & run this test again on both windows &
Mac to generate the required reference images for all platforms.
*/

const { test, expect } = require('@playwright/test')
const UPNG = require('upng-js')
let page

const floodOnlyGrayUrl = 'http://localhost:3000/?v=-141,-32,21,66&df=true&l=MODIS_Combined_Flood_2-Day(disabled=3-0)&lg=true&t=2023-12-07-T18%3A49%3A23Z'
const floodGrayAndBlueUrl = 'http://localhost:3000/?v=-139,-44,23,54&df=true&l=MODIS_Combined_Flood_2-Day(disabled=3-1)&lg=true&t=2023-12-07-T18%3A49%3A23Z'
const floodAllColorsUrl = 'http://localhost:3000/?v=40,22,53,33&df=true&l=MODIS_Combined_Flood_2-Day&lg=true&t=2023-01-07-T18%3A49%3A23Z'

test.describe.configure({ mode: 'serial', timeout: 60000 })

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterEach(async () => {
  await page.close()
})

test('Check colors in screenshot', async ({ page }) => {
  await page.goto(floodOnlyGrayUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(5000)
  const screenshot = await page.screenshot()
  const colorsFound = analyzePixels(screenshot)

  // Define expected colors
  const expectedColors = ['#cccccc', '#ddeedd']

  // Check if all expected colors are found
  expect(colorsFound).toEqual(expectedColors)
})

// test('Flood 2 Day only Gray', async () => {
//   await page.goto(floodOnlyGrayUrl)
//   await page.waitForLoadState('load')
//   await page.waitForTimeout(5000)

//   await expect(page).toHaveScreenshot('only-gray.png', {
//     fullPage: true,
//     threshold: 0.6
//   })
// })

// test('Flood 2 Day Gray & Blue', async () => {
//   await page.goto(floodGrayAndBlueUrl)
//   await page.waitForLoadState('load')
//   await page.waitForTimeout(5000)

//   await expect(page).toHaveScreenshot('gray-and-blue.png', {
//     fullPage: true,
//     threshold: 0.6
//   })
// })

// test('Flood 2 Day All Colors', async () => {
//   await page.goto(floodAllColorsUrl)
//   await page.waitForLoadState('load')
//   await page.waitForTimeout(5000)

//   await expect(page).toHaveScreenshot('all-colors.png', {
//     fullPage: true,
//     threshold: 0.2
//   })
// })

function analyzePixels (screenshot) {
  const imageData = decodeImageData(screenshot)
  const expectedColors = ['#cccccc', '#ddeedd']

  const colorsFound = new Set()
  for (let i = 0; i < imageData.length; i += 4) {
    const color = `#${('000000' + ((imageData[i] << 16) | (imageData[i + 1] << 8) | imageData[i + 2]).toString(16)).slice(-6)}`
    if (expectedColors.includes(color)) {
      colorsFound.add(color)
    }
  }

  return Array.from(colorsFound)
}

function decodeImageData (screenshot) {
  const decodedImage = UPNG.decode(screenshot)
  const rgbaData = UPNG.toRGBA8(decodedImage)[0]
  return rgbaData
}
