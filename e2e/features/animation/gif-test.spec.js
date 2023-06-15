// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const {
  animationTooManyFramesGifCustomInterval,
  activeAnimationWidget,
  animationTooManyFramesGif,
  animationProjectionRotated
} = require('../../test-utils/global-variables/querystrings')

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

test('Clicking the animation widget button opens the widget', async () => {
  const { createGifIcon, arcticRotationResetButton, rotationDialogOkButton } = selectors
  await page.goto(animationProjectionRotated)
  await createGifIcon.click()
  await expect(arcticRotationResetButton).toHaveText('-18')
  await rotationDialogOkButton.click()
  await expect(arcticRotationResetButton).toHaveText('0')
})

test('GIF selection preview is Accurate and selections that are too high disable GIF download', async () => {
  const {
    createGifIcon,
    gifPreviewStartDate,
    gifPreviewEndDate,
    gifPreviewFrameRateValue,
    gifPreviewEndResolutionSelector,
    gifDownloadButton
  } = selectors
  await page.goto(activeAnimationWidget)
  await createGifIcon.click()
  await expect(gifPreviewStartDate).toHaveText('2018 MAR 28')
  await expect(gifPreviewEndDate).toHaveText('2018 APR 04')
  await expect(gifPreviewFrameRateValue).toHaveText('3 Frames Per Second')
  const gifMaxSize = page.locator('.gif-max-size')
  await expect(gifMaxSize).toHaveText('8200px')
  const gifBox = page.locator('#wv-checkbox-gif')
  await expect(gifBox).toBeChecked()
  const gifResolution = page.locator('#gif-resolution')
  await gifResolution.click()
  await page.locator('#gif-resolution').selectOption('2')
  await expect(gifPreviewEndResolutionSelector).toHaveValue('2')
  await expect(gifDownloadButton).toBeDisabled()
})

test('GIF download is disabled when too many frames would be requested with standard interval', async () => {
  await page.goto(animationTooManyFramesGif)
  const createGif = page.locator('#create-gif-button')
  await expect(createGif).toHaveClass(/disabled/)
})

test('GIF download is disabled when too many frames would be requested with custom interval', async () => {
  await page.goto(animationTooManyFramesGifCustomInterval)
  const createGif = page.locator('#create-gif-button')
  await expect(createGif).toHaveClass(/disabled/)
})
