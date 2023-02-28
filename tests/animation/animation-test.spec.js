// @ts-check
const { test, expect } = require('@playwright/test')
const localQueryStrings = require('../../test-utils/global-variables/querystrings.js')

let dragger

let page

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()



})

test.afterAll(async () => {
  await page.close()
})

test('', async () => {
  // await page.goto()

})