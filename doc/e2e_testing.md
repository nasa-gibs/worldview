# End-To-End Testing

End-to-end tests are integrated into our CI and are required to pass before a submission is accepted. New features should be accompanied by end-to-end tests to cover any new functionality you add.

## Scripts

- `e2e` :  Builds WV and runs the end-to-end tests for Firefox & Chromium in a Docker container

See the [Docker](docker.md) page for more information.

## Playwright Binaries

Playwright is a powerful end-to-end testing library that provides a high-level API to automate and test web applications in multiple browsers, including Chromium, WebKit, and Firefox.

To perform the testing and automation tasks, Playwright requires browser binaries that are specifically built and configured for use with Playwright.

These binaries are essential for running end-to-end tests using Playwright, as they contain the necessary components for launching and controlling the browsers in a way that is compatible with the Playwright API.

To run Playwright tests locally you will need to run `npx playwright install` which will install the latest binaries for Chromium, Firefox & Webkit.

## Commands

Playwright commands can be used to run the entire test suite, individual tests and launch different features.

- `npx playwright test` : Runs all tests headless
- `npx playwright test --headed` : Runs all tests headless
- `npx playwright test --project=firefox` : Run all tests headless for specific browser
- `npx playwright test --headed --project=firefox` : Run all tests headed for specific browser
- `npx playwright test compare-test.spec.js` : Run individual test headless
- `npx playwright test compare-test.spec.js --headed` : Run individual test headed
- `npx playwright test compare-test.spec.js --headed --project=firefox` : Run individual test headed for specific browser
- `npx playwright test compare-test.spec.js --repeat-each=5` : Run individual test in a loop
- `npx playwright test compare-test.spec.js --debug` : Run individual test in debug mode
- `npx playwright codegen http://localhost:3000` : Launch codegen
- `npx playwright codegen http://localhost:3000 --viewport-size=375,667` : Launch codegen in a mobile viewport

## slowMo Mode

The `slowMo` property can be found in playwright.config.js file at the root directory.

This property can be changed to a higher value to make it easier to watch the actions taking place in headed mode.

## codegen

The Playwright codegen feature is an incredibly useful tool within the Playwright end-to-end testing framework that helps developers effortlessly generate code for their test scripts.

By recording user interactions with the application, the codegen feature automatically generates the corresponding Playwright code, saving time and effort in writing tests.

This feature can be launched in a desktop or mobile view.

- `npx playwright codegen http://localhost:3000` : Launch codegen
- `npx playwright codegen http://localhost:3000 --viewport-size=375,667` : Launch codegen in a mobile viewport

## Global Variables & Hooks

Global variables & hooks can be found within the test-utils directory of the e2e directory.

### **Global Variables**

Global variables can be added to the selectors.js file when you need to find an element in two or more test files.

Query strings can also be added to the querystrings.js file when you need to use a URL in two or more test files.

### **Hooks**

Several hooks have been created in both the basicHooks.js & wvHooks.js files.

These hooks typically perform two or more Playwright actions or assertions and can be reused within different test files for readability and ease of use.

The basicHooks.js file contains hooks that perform generic operations such as the `selectOption` hook that selects an option from a dropdown.

The wvHooks.js file contains hooks that perform Worldview specific operations such as the `createDistanceMeasurement` hook that will create a line measurement based on a start and finish location.

## Creating End-To-End Tests

This section will go over the basics of creating an end-to-end test. This will use `recent-layers-test.spec.js` as an example if you want to follow along.

### **Imports & Top Level Variables**

```
// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { assertCategories } = require('../../test-utils/hooks/wvHooks')

let page
let selectors

const url = 'http://localhost:3000/?t=2020-07-04'
```
- Each test file must import `test` & `expect` from the `@playwright/test` library
- `createSelectors` is how we import the global selectors from the `selectors.js` file
- `assertCategories` is a Worldview specific hook. We can import any hooks we need for our test here
- We must declare `page`, `selectors` and any other variables we plan to use in multiple tests within this file at the top level here

### **Test Order & Life Cycle Hooks**

```
test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})
```
- The `test.describe` property must be configured with `'serial'` to make the tests run in the order that they are written
- The `beforeAll` hook is where we will define our `page` and `selectors` variable before all of our tests run. The `page` variable represents the current state of the browser
- The `afterAll` hook is crucial to make sure the next test file is run properly. We close the page after all the tests in the file have run

### **Tests**

```
test('Select several layers', async () => {
  const { layersSearchField, layerPickerBackButton } = selectors
  await layersSearchField.fill('aod')
  await page.locator('#MODIS_Aqua_Aerosol-checkbox').click()
  await page.locator('#MODIS_Combined_Value_Added_AOD-checkbox').click()
  await page.locator('#OMI_Aerosol_Optical_Depth-checkbox').click()
  await layerPickerBackButton.click()
})

test('Recent tab shows layers that were selected', async () => {
  await page.locator('.recent-tab').click()
  const aquaAerosolRow = await page.locator('#MODIS_Aqua_Aerosol-search-row')
  const aodSearchRow = await page.locator('#MODIS_Combined_Value_Added_AOD-search-row')
  const omiSearchRow = await page.locator('#OMI_Aerosol_Optical_Depth-search-row')
  await expect(aquaAerosolRow).toBeVisible()
  await expect(omiSearchRow).toBeVisible()
  await expect(aodSearchRow).toBeVisible()
})
```
- Each test is an async function that requires a description parameter
- We can destructure the variables we need from the selectors object
- For elements that are not defined in the `selectors.js` file you can use `page.locator()` or any other locator. A full list can be found in the [Playwright Locators docs](https://playwright.dev/docs/locators)
- If you are only performing an action on an element such as `click()` you do not need to define the element as a variable. You can simply write `await page.locator('.recent-tab').click()`
- If you are performing an assertion on an element, you will need to define the element as a variable first `const aquaAerosolRow = await page.locator('#MODIS_Aqua_Aerosol-search-row')` `await expect(aquaAerosolRow).toBeVisible()`