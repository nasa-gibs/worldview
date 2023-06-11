// An array of layers that we want to measure in EIC mode
export const layersToMeasure = [
  'MODIS_Terra_CorrectedReflectance_TrueColor',
  'VIIRS_SNPP_DayNightBand_At_Sensor_Radiance',
  'VIIRS_SNPP_CorrectedReflectance_TrueColor',
  'GHRSST_L4_MUR_Sea_Surface_Temperature',
  'MODIS_Aqua_Land_Surface_Temp_Day',
  'MODIS_Aqua_CorrectedReflectance_TrueColor',
  'IMERG_Precipitation_Rate',
  'GOES-East_ABI_GeoColor',
  'GOES-West_ABI_GeoColor',
  'Himawari_AHI_Band3_Red_Visible_1km',
]

// Object that contains the black pixel % threshold for each layer
// Threshold values represent the amount of black pixels as a percentage that CAN be present in an image
export const layerPixelData = {
  // full imagery threshold
  'MODIS_Terra_CorrectedReflectance_TrueColor': { threshold: .70 },
  'VIIRS_SNPP_DayNightBand_At_Sensor_Radiance': { threshold: .70 },
  // I think we want to keep this threshold higher since it's using the fires layer
  'VIIRS_SNPP_CorrectedReflectance_TrueColor': { threshold: .50 },
  'IMERG_Precipitation_Rate': { threshold: .95 },
  'GHRSST_L4_MUR_Sea_Surface_Temperature': { threshold: .65 },
  'MODIS_Aqua_Land_Surface_Temp_Day': { threshold: .80 },
  'MODIS_Aqua_CorrectedReflectance_TrueColor': { threshold: .50 },
  'GOES-East_ABI_GeoColor': { threshold: .75 },
  'GOES-West_ABI_GeoColor': { threshold: .75 },
  'Himawari_AHI_Band3_Red_Visible_1km': { threshold: .75 },
}

// Back-up dates for each layer in case no date is found that satisfies the full imagery threshold
// TO DO: These layers will eventually need to be prioritized if a scenario has layers from multiple best dates
// Right now it just returns the first layer's best date
export const bestDates = {
  'GOES-East_ABI_GeoColor': { date: '2023-06-10T12:35:00.000Z' },
  'GOES-West_ABI_GeoColor': { date: '2023-06-10T12:35:00.000Z' },
  'Himawari_AHI_Band3_Red_Visible_1km': { date: '2023-06-10T12:35:00.000Z' },
}