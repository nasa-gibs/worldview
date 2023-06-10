// An array of layers that we want to measure in EIC mode
export const layersToMeasure = [
  'MODIS_Terra_CorrectedReflectance_TrueColor',
  'VIIRS_SNPP_Thermal_Anomalies_375m_Day',
  'GOES-East_ABI_GeoColor',
  'GOES-West_ABI_GeoColor',
  'Himawari_AHI_Band3_Red_Visible_1km',
]

// Object that contains the black pixel % threshold for each layer
// Threshold values represent the amount of black pixels as a percentage that CAN be present in an image
export const layerPixelData = {
  // full imagery threshold
  'MODIS_Terra_CorrectedReflectance_TrueColor': { threshold: .31 },
  'GOES-East_ABI_GeoColor': { threshold: .75 },
  'GOES-West_ABI_GeoColor': { threshold: .75 },
  'Himawari_AHI_Band3_Red_Visible_1km': { threshold: .75 },
}