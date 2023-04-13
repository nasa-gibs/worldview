// @ts-check
const { test, expect } = require('@playwright/test')
const createSelectors = require('../../test-utils/global-variables/selectors')
const { skipTour } = require('../../test-utils/global-variables/querystrings')
const { getAttribute } = require('../../test-utils/hooks/basicHooks')

let page
let selectors
let context

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext()
  page = await context.newPage()
  selectors = createSelectors(page)
})

test.afterAll(async () => {
  await page.close()
})

test('Clicking the share link button opens the share dialog', async () => {
  const { shareToolbarButton, shareToolbar } = selectors
  await page.goto(skipTour)
  await shareToolbarButton.click()
  await expect(shareToolbar).toBeVisible()
})

test('Share tabs link and social are visible and enabled', async () => {
  const linkShareNav = await page.locator('.link-share-nav')
  const socialShareNav = await page.locator('.social-share-nav')
  const linkShareActive = await page.locator('.link-share-nav a')
  await expect(linkShareNav).toBeVisible()
  await expect(socialShareNav).toBeVisible()
  await expect(linkShareActive).toHaveClass(/active/)
})

test('Share link clipboard with existing time query string param in the page url will have the same serialized time', async () => {
  const { shareToolbarButton, shareLinkInput } = selectors
  const queryString = 'http://localhost:3000/?t=2018-12-31'
  await page.goto(queryString)
  await shareToolbarButton.click()
  const url = await page.url()
  expect(url).toContain('t=')
  await expect(shareLinkInput).toHaveValue('http://localhost:3000/?t=2018-12-31-T00%3A00%3A00Z')
})

test('Share link clipboard with no time query string param in the page url will have the same serialized time (partial YYYY-MM-DD)', async () => {
  const { shareToolbarButton } = selectors
  const queryString = 'http://localhost:3000/'
  await page.goto(queryString)
  await page.getByRole('button', { name: '×' }).click()
  await shareToolbarButton.click()
  const minutesOffset = 40 * 60000 // 40 minutes
  let date = new Date(new Date().getTime() - minutesOffset)
  if (date.getUTCHours() < 3) {
    date = new Date(date.getTime() - 86400000)
  }
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const monthText = month < 10 ? `0${month}` : month
  const dayText = day < 10 ? `0${day}` : day
  const url = await page.url()
  expect(url).not.toContain('t=')
  const shareLinkValue = await getAttribute(page, '#permalink-content-link', 'value')
  expect(shareLinkValue).toContain(`t=${year}-${monthText}-${dayText}`)
})

test('Clicking the social tab displays social share buttons', async () => {
  const { shareToolbarButton } = selectors
  const facebook = await page.locator('#fb-share')
  const twitter = await page.locator('#tw-share')
  const reddit = await page.locator('#rd-share')
  const email = await page.locator('#email-share')
  await shareToolbarButton.click()
  await page.locator('.social-share-nav a').click()
  await expect(facebook).toBeVisible()
  await expect(twitter).toBeVisible()
  await expect(reddit).toBeVisible()
  await expect(email).toBeVisible()
})

test('Clicking Shorten link works with links less than 2049 characters', async () => {
  const { shareToolbarButton } = selectors
  const shortQueryString = 'http://localhost:3000/?l=Reference_Labels_15m,Reference_Features_15m,Coastlines_15m,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&lg=true&t=2022-08-10-T15%3A15%3A05Z'
  await page.goto(shortQueryString)
  const linkShortenCase = await page.locator('#wv-link-shorten-case')
  await shareToolbarButton.click()
  await linkShortenCase.click()
  await expect(linkShortenCase).toHaveClass(/checked/)
})

test('Clicking Shorten link is refused with links greater than 2048 characters', async () => {
  const { shareToolbarButton } = selectors
  const longQueryString = 'http://localhost:3000/?l=MODIS_Terra_AOD_Deep_Blue_Combined,MODIS_Terra_AOD_Deep_Blue_Land,MODIS_Terra_Angstrom_Exponent_Ocean,MODIS_Terra_Angstrom_Exponent_Land,MODIS_Terra_Aerosol_Optical_Depth_3km,MODIS_Terra_Aerosol,MISR_Aerosol_Optical_Depth_Avg_Green_Monthly,VIIRS_SNPP_Angstrom_Exponent_Dark_Target_Ocean,VIIRS_SNPP_AOT_Dark_Target_Land_Ocean,VIIRS_SNPP_Angstrom_Exponent_Deep_Blue_Best_Estimate,VIIRS_SNPP_AOT_Deep_Blue_Best_Estimate,SWDB_Aerosol_Angstrom_Exponent_Monthly,SWDB_Aerosol_Optical_Thickness_550nm_Monthly,SWDB_Aerosol_Angstrom_Exponent_Daily,SWDB_Aerosol_Optical_Thickness_550nm_Daily,MERRA2_Total_Aerosol_Optical_Thickness_550nm_Extinction_Monthly,MERRA2_Total_Aerosol_Optical_Thickness_550nm_Scattering_Monthly,OMI_Absorbing_Aerosol_Optical_Thickness_MW_388,OMI_Absorbing_Aerosol_Optical_Depth,OMI_Aerosol_Optical_Depth,MODIS_Aqua_AOD_Deep_Blue_Combined,MODIS_Aqua_AOD_Deep_Blue_Land,MODIS_Aqua_Angstrom_Exponent_Ocean,MODIS_Aqua_Angstrom_Exponent_Land,MODIS_Aqua_Aerosol_Optical_Depth_3km,MODIS_Aqua_Aerosol,MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth,MODIS_Combined_Value_Added_AOD,MLS_CO_215hPa_Night,MLS_CO_215hPa_Day,AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Monthly_Night,AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Monthly_Day,AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Night,AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Day,AIRS_L2_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Night,AIRS_L2_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Day,OrbitTracks_Aura_Descending,OrbitTracks_Aura_Ascending,OrbitTracks_Aqua_Ascending,OrbitTracks_Suomi_NPP_Ascending,VIIRS_SNPP_Aerosol_Type_Deep_Blue_Best_Estimate,Reference_Labels_15m,Reference_Features_15m,Coastlines_15m,MODIS_Combined_L3_Nadir-BRDF_Daily,MODIS_Combined_MAIAC_L2G_BidirectionalReflectance_Bands143,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&lg=true&t=2022-08-10-T15%3A15%3A05Z'
  await page.goto(longQueryString)
  const linkShortenCase = await page.locator('#wv-link-shorten-case')
  await shareToolbarButton.click()
  await linkShortenCase.click()
  await expect(linkShortenCase).not.toHaveClass(/checked/)
})
