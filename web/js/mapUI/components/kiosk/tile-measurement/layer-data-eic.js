// An array of layers that we want to measure in EIC mode
export const layersToMeasure = [
  'MODIS_Terra_CorrectedReflectance_TrueColor',
  'VIIRS_SNPP_Thermal_Anomalies_375m_Day',
  'GOES-East_ABI_GeoColor',
  'GOES-West_ABI_GeoColor',
  'Himawari_AHI_Band3_Red_Visible_1km',
]

// Object that contains the black pixel % threshold for each layer
export const layerPixelData = {
  'MODIS_Terra_CorrectedReflectance_TrueColor': { threshold: 30 }

}