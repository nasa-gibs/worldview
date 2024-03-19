// @ts-check
const { test, expect } = require('@playwright/test')
const UPNG = require('upng-js')
let page

const floodOnlyGrayUrl = 'http://localhost:3000/?v=-213,-96,107,99&df=true&l=MODIS_Combined_Flood_2-Day(disabled=3-0)&lg=true&t=2023-12-07-T18%3A49%3A23Z'
const floodGrayAndBlueUrl = 'http://localhost:3000/?v=-195,-120,202,122&df=true&l=MODIS_Combined_Flood_2-Day(disabled=3-1)&lg=true&t=2023-12-07-T18%3A49%3A23Z'
const floodAllColorsUrl = 'http://localhost:3000/?v=20.927495068573297,59.38686212149608,23.42534040372529,60.914081461203466&l=MODIS_Combined_Flood_2-Day(disabled=3)&lg=true&t=2021-04-05-T18%3A49%3A23Z'

// RGB Colors taken from the colormap for the flood layer
const red = '250,30,36,255'
const blue = '50,210,245,255'
const gray = '175,175,175,255'

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage()
})

test.afterEach(async () => {
  await page.close()
})

test('Flood 2 Day only Gray', async () => {
  await page.goto(floodOnlyGrayUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(3000)
  const screenshot = await page.screenshot()
  const colorsFound = analyzePixels(screenshot)
  const isRed = colorsFound.indexOf(red) > -1
  const isBlue = colorsFound.indexOf(blue) > -1
  const isGray = colorsFound.indexOf(gray) > -1
  const isGrayOnly = !isRed && !isBlue && isGray
  expect(isGrayOnly).toEqual(true)
})

test('Flood 2 Day Gray & Blue', async () => {
  await page.goto(floodGrayAndBlueUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(3000)
  const screenshot = await page.screenshot()
  const colorsFound = analyzePixels(screenshot)
  const isRed = colorsFound.indexOf(red) > -1
  const isBlue = colorsFound.indexOf(blue) > -1
  const isGray = colorsFound.indexOf(gray) > -1
  const isGrayAndBlue = !isRed && isBlue && isGray
  expect(isGrayAndBlue).toEqual(true)
})

test('Flood 2 Day All Colors', async () => {
  await page.goto(floodAllColorsUrl)
  await page.waitForLoadState('load')
  await page.waitForTimeout(3000)
  const screenshot = await page.screenshot()
  const colorsFound = analyzePixels(screenshot)
  const isRed = colorsFound.indexOf(red) > -1
  const isBlue = colorsFound.indexOf(blue) > -1
  const isGray = colorsFound.indexOf(gray) > -1
  const isRedAndBlueAndGray = isRed && isBlue && isGray
  expect(isRedAndBlueAndGray).toEqual(true)
})

function analyzePixels (screenshot) {
  const imageData = decodeImageData(screenshot)
  const colorsFound = new Set()
  const uint8Array = new Uint8Array(imageData)
  for (let i = 0; i < uint8Array.length; i += 4) {
    const pixelColor = [
      uint8Array[i], // Red
      uint8Array[i + 1], // Green
      uint8Array[i + 2], // Blue
      uint8Array[i + 3] // Alpha
    ]
    const colorString = pixelColor.join(',')
    colorsFound.add(colorString)
  }
  return Array.from(colorsFound)
}

function decodeImageData (screenshot) {
  const decodedImage = UPNG.decode(screenshot)
  const rgbaData = UPNG.toRGBA8(decodedImage)[0]
  return rgbaData
}
