const layerItem = '.item.productsitem'
const categoriesContainer = '.category-masonry-case'
module.exports = {
  assertCategories: (client) => () => {
    client.expect.element(categoriesContainer).to.be.present
    client.expect.element('#legacy-all').to.be.present
    client.expect.element('#air-quality').to.be.present
    client.expect.element('#ash-plumes').to.be.present
    client.expect.element('#drought').to.be.present
    client.expect.element('#fires').to.be.present
    client.expect.element('#floods').to.be.present
    client.expect.element('#shipping').to.be.present
    client.expect.element('#dust-storms').to.be.present
    client.expect.element('#severe-storms').to.be.present
    client.expect.element('#smoke-plumes').to.be.present
    client.expect.element('#vegetation').to.be.present
    client.expect.element('#legacy-other').to.be.present
  },
  assertDefaultLayers: (client) => () => {
    client.expect.elements(layerItem).count.to.equal(7)
    client.expect.element('#active-Reference_Labels_15m').to.be.present
    client.expect.element('#active-Reference_Features_15m').to.be.present
    client.expect.element('#active-Coastlines_15m').to.be.present
    client.expect.element('#active-VIIRS_SNPP_CorrectedReflectance_TrueColor').to.be.present
    client.expect.element('#active-MODIS_Aqua_CorrectedReflectance_TrueColor').to.be.present
    client.expect.element('#active-MODIS_Terra_CorrectedReflectance_TrueColor').to.be.present
    client.expect.element('#active-VIIRS_NOAA20_CorrectedReflectance_TrueColor').to.be.present
  }
}
