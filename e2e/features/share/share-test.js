const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')

const TIME_LIMIT = 10000

const {
  shareToolbar,
  shareToolbarButton,
  shareLinkInput
} = localSelectors

const linkShareNav = '.link-share-nav'
// const embedShareNav = '.embed-share-nav';
const socialShareNav = '.social-share-nav'

module.exports = {
  before (c) {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },
  'Clicking the share link button opens the share dialog': (c) => {
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT)
    c.click(shareToolbarButton)
    c.waitForElementVisible(shareToolbar, TIME_LIMIT)
    c.expect.element(shareToolbar).to.be.present
  },
  'Share tabs link, embed, and social are visible and enabled': (c) => {
    c.expect.element(linkShareNav).to.be.present
    // c.expect.element(embedShareNav).to.be.present;
    c.expect.element(socialShareNav).to.be.present
    c.assert.cssClassPresent(`${linkShareNav} a`, 'active')
  },
  'Share link clipboard with existing time query string param in the page url will have the same serialized time': (c) => {
    const queryString = '?t=2018-12-31'
    c.url(c.globals.url + queryString)
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT)
    c.click(shareToolbarButton)
    c.assert.urlContains('t=')
    c.assert.attributeContains(shareLinkInput, 'value', `${c.globals.url}?t=2018-12-31-T00%3A00%3A00Z`)
  },
  'Share link clipboard with no time query string param in the page url will have the same serialized time (partial YYYY-MM-DD)': (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT)
    c.click(shareToolbarButton)
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
    c.assert.not.urlContains('t=')
    c.assert.attributeContains(shareLinkInput, 'value', `t=${year}-${monthText}-${dayText}`)
  },
  'Clicking the social tab displays social share buttons': (c) => {
    c.click(shareToolbarButton)
    c.waitForElementVisible(shareToolbar, TIME_LIMIT)
    c.click(`${socialShareNav} a`)
    c.waitForElementVisible('#social-share', TIME_LIMIT)
    c.expect.element('#fb-share').to.be.present
    c.expect.element('#tw-share').to.be.present
    c.expect.element('#rd-share').to.be.present
    c.expect.element('#email-share').to.be.present
  },
  'Clicking Shorten link works with links less than 2049 characters': (c) => {
    const shortQueryString = '?l=Reference_Labels_15m,Reference_Features_15m,Coastlines_15m,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&lg=true&t=2022-08-10-T15%3A15%3A05Z'
    c.url(c.globals.url + shortQueryString)
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT)
    c.click(shareToolbarButton)
    c.waitForElementVisible('#wv-link-shorten-case', TIME_LIMIT)
    c.click('#wv-link-shorten-case')
    c.assert.cssClassPresent('#wv-link-shorten-case', 'checked')
  },
  'Clicking Shorten link is refused with links greater than 2048 characters': (c) => {
    const longQueryString = '?l=MODIS_Terra_AOD_Deep_Blue_Combined,MODIS_Terra_AOD_Deep_Blue_Land,MODIS_Terra_Angstrom_Exponent_Ocean,MODIS_Terra_Angstrom_Exponent_Land,MODIS_Terra_Aerosol_Optical_Depth_3km,MODIS_Terra_Aerosol,MISR_Aerosol_Optical_Depth_Avg_Green_Monthly,VIIRS_SNPP_Angstrom_Exponent_Dark_Target_Ocean,VIIRS_SNPP_AOT_Dark_Target_Land_Ocean,VIIRS_SNPP_Angstrom_Exponent_Deep_Blue_Best_Estimate,VIIRS_SNPP_AOT_Deep_Blue_Best_Estimate,SWDB_Aerosol_Angstrom_Exponent_Monthly,SWDB_Aerosol_Optical_Thickness_550nm_Monthly,SWDB_Aerosol_Angstrom_Exponent_Daily,SWDB_Aerosol_Optical_Thickness_550nm_Daily,MERRA2_Total_Aerosol_Optical_Thickness_550nm_Extinction_Monthly,MERRA2_Total_Aerosol_Optical_Thickness_550nm_Scattering_Monthly,OMI_Absorbing_Aerosol_Optical_Thickness_MW_388,OMI_Absorbing_Aerosol_Optical_Depth,OMI_Aerosol_Optical_Depth,MODIS_Aqua_AOD_Deep_Blue_Combined,MODIS_Aqua_AOD_Deep_Blue_Land,MODIS_Aqua_Angstrom_Exponent_Ocean,MODIS_Aqua_Angstrom_Exponent_Land,MODIS_Aqua_Aerosol_Optical_Depth_3km,MODIS_Aqua_Aerosol,MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth,MODIS_Combined_Value_Added_AOD,MLS_CO_215hPa_Night,MLS_CO_215hPa_Day,AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Monthly_Night,AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Monthly_Day,AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Night,AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Day,AIRS_L2_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Night,AIRS_L2_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Day,OrbitTracks_Aura_Descending,OrbitTracks_Aura_Ascending,OrbitTracks_Aqua_Ascending,OrbitTracks_Suomi_NPP_Ascending,VIIRS_SNPP_Aerosol_Type_Deep_Blue_Best_Estimate,Reference_Labels_15m,Reference_Features_15m,Coastlines_15m,MODIS_Combined_L3_Nadir-BRDF_Daily,MODIS_Combined_MAIAC_L2G_BidirectionalReflectance_Bands143,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&lg=true&t=2022-08-10-T15%3A15%3A05Z'
    c.url(c.globals.url + longQueryString)
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT)
    c.click(shareToolbarButton)
    c.waitForElementVisible('#wv-link-shorten-case', TIME_LIMIT)
    c.click('#wv-link-shorten-case')
    c.assert.not.cssClassPresent('#wv-link-shorten-case', 'checked')
  },
  after (c) {
    c.end()
  }
}
