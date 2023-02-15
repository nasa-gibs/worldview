const { chromium, firefox, webkit } = require('@playwright/test');

const launchBrowser = async (browserName, url) => {
  const browser = await { chromium, firefox, webkit }[browserName].launch();
  const page = await browser.newPage();
  await page.goto(url);
  return page;
};

const launchBrowserSkipTour = async (browserName, url) => {
  const browser = await { chromium, firefox, webkit }[browserName].launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.getByRole('link', { name: 'Start using @NAME@' }).click();
  return page;
};

module.exports = {
  launchBrowser,
  launchBrowserSkipTour
};