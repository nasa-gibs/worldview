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
  'AMSRU2_Sea_Ice_Concentration_12km',
];

// Object that contains the black pixel % threshold for each layer
// Threshold values represent the amount of black pixels as a percentage that CAN be present in an image
export const layerPixelData = {
  MODIS_Terra_CorrectedReflectance_TrueColor: { threshold: 0.70 },
  VIIRS_SNPP_DayNightBand_At_Sensor_Radiance: { threshold: 0.70 },
  VIIRS_SNPP_CorrectedReflectance_TrueColor: { threshold: 0.65 },
  IMERG_Precipitation_Rate: { threshold: 0.95 },
  GHRSST_L4_MUR_Sea_Surface_Temperature: { threshold: 0.65 },
  MODIS_Aqua_Land_Surface_Temp_Day: { threshold: 0.80 },
  MODIS_Aqua_CorrectedReflectance_TrueColor: { threshold: 0.50 },
  'GOES-East_ABI_GeoColor': { threshold: 0.76 },
  'GOES-West_ABI_GeoColor': { threshold: 0.76 },
  Himawari_AHI_Band3_Red_Visible_1km: { threshold: 0.76 },
  AMSRU2_Sea_Ice_Concentration_12km: { threshold: 0.85 },
};

// Back-up dates for each layer in case no date is found that satisfies the full imagery threshold
// TO DO: These layers will eventually need to be prioritized if a scenario has layers from multiple best dates
export const bestDates = {
  'GOES-East_ABI_GeoColor': { date: '2023-06-10T23:50:00.000Z' },
  'GOES-West_ABI_GeoColor': { date: '2023-06-10T23:50:00.000Z' },
  Himawari_AHI_Band3_Red_Visible_1km: { date: '2023-06-10T23:50:00.000Z' },
  MODIS_Terra_CorrectedReflectance_TrueColor: { date: '2023-06-10' },
  VIIRS_SNPP_DayNightBand_At_Sensor_Radiance: { date: '2023-06-10' },
  VIIRS_SNPP_CorrectedReflectance_TrueColor: { date: '2023-06-10' },
  IMERG_Precipitation_Rate: { date: '2023-06-10' },
  GHRSST_L4_MUR_Sea_Surface_Temperature: { date: '2023-06-10' },
  MODIS_Aqua_Land_Surface_Temp_Day: { date: '2023-06-10' },
  MODIS_Aqua_CorrectedReflectance_TrueColor: { date: '2023-06-10' },
};
