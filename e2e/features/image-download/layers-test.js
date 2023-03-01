const { bookmark } = require('../../reuseables/bookmark')
const {
  openImageDownloadPanel,
  clickDownload
} = require('../../reuseables/image-download')

const startParams = [
  'v=-180,-90,180,90',
  't=2018-06-01',
  'imageDownload='
]

module.exports = {
  after (client) {
    client.end()
  },

  'List layers in draw order': function (c) {
    bookmark(c, startParams.concat(['l=MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Features_15m,MODIS_Terra_Aerosol']))
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Reference_Features_15m')
  },

  'Move AOD over the reference features': function (c) {
    bookmark(c, startParams.concat(['l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol,Reference_Features_15m']))
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Features_15m,MODIS_Terra_Aerosol')
  },

  'Do not include obscured layers': function (c) {
    bookmark(c, startParams.concat(['l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor']))
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor')
  },

  'Multiple base layers when one is semi-transparent': function (c) {
    bookmark(c, startParams.concat(['l=MODIS_Terra_CorrectedReflectance_TrueColor(opacity=0.5),MODIS_Aqua_CorrectedReflectance_TrueColor']))
    openImageDownloadPanel(c)
    clickDownload(c)
    c.expect.element('#wv-image-download-url').to.have.attribute('url')
      .and.to.contain('LAYERS=MODIS_Aqua_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor')
      .and.to.contain('OPACITIES=,0.5')
  }

}
