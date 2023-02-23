const { chromium, firefox, webkit } = require('@playwright/test')

const launchBrowser = async (browserName, url) => {
  const browser = await { chromium, firefox, webkit }[browserName].launch()
  const page = await browser.newPage()
  await page.goto(url)
  return page
}

const launchBrowserSkipTour = async (browserName, url) => {
  const browser = await { chromium, firefox, webkit }[browserName].launch()
  const page = await browser.newPage()
  await page.goto(url)
  await page.getByRole('link', { name: 'Start using @NAME@' }).click()
  return page
}

const switchProjections = async (page, proj) => {
  await page.locator('#wv-proj-button').click()
  await page.locator(`#change-${proj}-button`).click()
}

module.exports = {
  launchBrowser,
  launchBrowserSkipTour,
  switchProjections
}
