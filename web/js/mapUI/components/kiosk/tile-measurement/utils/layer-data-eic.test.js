import {
  layerPixelData,
  bestDates,
  layersToMeasure,
  travelModeData,
} from './layer-data-eic';

// ─── layerPixelData ───────────────────────────────────────────────────────────

describe('layerPixelData', () => {
  describe('structure', () => {
    it('is an object', () => {
      expect(typeof layerPixelData).toBe('object');
      expect(layerPixelData).not.toBeNull();
    });

    it('every entry has a numeric threshold property', () => {
      Object.values(layerPixelData).forEach(({ threshold }) => {
        expect(typeof threshold).toBe('number');
      });
    });

    it('every threshold is between 0 and 1 (inclusive)', () => {
      Object.values(layerPixelData).forEach(({ threshold }) => {
        expect(threshold).toBeGreaterThanOrEqual(0);
        expect(threshold).toBeLessThanOrEqual(1);
      });
    });

    it('every entry has exactly one key (threshold)', () => {
      Object.values(layerPixelData).forEach((entry) => {
        expect(Object.keys(entry)).toEqual(['threshold']);
      });
    });
  });

  describe('individual layer thresholds', () => {
    it('MODIS_Terra_CorrectedReflectance_TrueColor has threshold 0.70', () => {
      expect(layerPixelData.MODIS_Terra_CorrectedReflectance_TrueColor.threshold).toBe(0.70);
    });

    it('VIIRS_SNPP_DayNightBand_At_Sensor_Radiance has threshold 0.70', () => {
      expect(layerPixelData.VIIRS_SNPP_DayNightBand_At_Sensor_Radiance.threshold).toBe(0.70);
    });

    it('VIIRS_SNPP_CorrectedReflectance_TrueColor has threshold 0.65', () => {
      expect(layerPixelData.VIIRS_SNPP_CorrectedReflectance_TrueColor.threshold).toBe(0.65);
    });

    it('IMERG_Precipitation_Rate has threshold 0.95', () => {
      expect(layerPixelData.IMERG_Precipitation_Rate.threshold).toBe(0.95);
    });

    it('GHRSST_L4_MUR_Sea_Surface_Temperature has threshold 0.65', () => {
      expect(layerPixelData.GHRSST_L4_MUR_Sea_Surface_Temperature.threshold).toBe(0.65);
    });

    it('MODIS_Aqua_Land_Surface_Temp_Day has threshold 0.80', () => {
      expect(layerPixelData.MODIS_Aqua_Land_Surface_Temp_Day.threshold).toBe(0.80);
    });

    it('MODIS_Aqua_CorrectedReflectance_TrueColor has threshold 0.50', () => {
      expect(layerPixelData.MODIS_Aqua_CorrectedReflectance_TrueColor.threshold).toBe(0.50);
    });

    it('GOES-East_ABI_GeoColor has threshold 0.76', () => {
      expect(layerPixelData['GOES-East_ABI_GeoColor'].threshold).toBe(0.76);
    });

    it('GOES-West_ABI_GeoColor has threshold 0.76', () => {
      expect(layerPixelData['GOES-West_ABI_GeoColor'].threshold).toBe(0.76);
    });

    it('Himawari_AHI_Band3_Red_Visible_1km has threshold 0.76', () => {
      expect(layerPixelData.Himawari_AHI_Band3_Red_Visible_1km.threshold).toBe(0.76);
    });

    it('AMSRU2_Sea_Ice_Concentration_12km has threshold 0.85', () => {
      expect(layerPixelData.AMSRU2_Sea_Ice_Concentration_12km.threshold).toBe(0.85);
    });

    it('OMI_Nitrogen_Dioxide_Tropo_Column has threshold 0.50', () => {
      expect(layerPixelData.OMI_Nitrogen_Dioxide_Tropo_Column.threshold).toBe(0.50);
    });

    it('VIIRS_SNPP_AOD_Dark_Target_Land_Ocean has threshold 0.95', () => {
      expect(layerPixelData.VIIRS_SNPP_AOD_Dark_Target_Land_Ocean.threshold).toBe(0.95);
    });

    it('VIIRS_SNPP_AOT_Deep_Blue_Best_Estimate has threshold 0.95', () => {
      expect(layerPixelData.VIIRS_SNPP_AOT_Deep_Blue_Best_Estimate.threshold).toBe(0.95);
    });

    it('AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Night has threshold 0.20', () => {
      expect(
        layerPixelData.AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Night.threshold,
      ).toBe(0.20);
    });

    it('AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Day has threshold 0.20', () => {
      expect(
        layerPixelData.AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Day.threshold,
      ).toBe(0.20);
    });

    it('VIIRS_NOAA20_CorrectedReflectance_TrueColor has threshold 0.65', () => {
      expect(layerPixelData.VIIRS_NOAA20_CorrectedReflectance_TrueColor.threshold).toBe(0.65);
    });

    it('CERES_EBAF_TOA_Shortwave_Flux_All_Sky_Monthly has threshold 0.01', () => {
      expect(layerPixelData.CERES_EBAF_TOA_Shortwave_Flux_All_Sky_Monthly.threshold).toBe(0.01);
    });

    it('TEMPO_L3_NO2_Vertical_Column_Troposphere has threshold 0.99', () => {
      expect(layerPixelData.TEMPO_L3_NO2_Vertical_Column_Troposphere.threshold).toBe(0.99);
    });

    it('TEMPO_L3_Ozone_Column_Amount has threshold 0.99', () => {
      expect(layerPixelData.TEMPO_L3_Ozone_Column_Amount.threshold).toBe(0.99);
    });

    it('VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance has threshold 0.45', () => {
      expect(layerPixelData.VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance.threshold).toBe(0.45);
    });

    it('VIIRS_NOAA20_DayNightBand_AtSensor_M15 has threshold 0.10', () => {
      expect(layerPixelData.VIIRS_NOAA20_DayNightBand_AtSensor_M15.threshold).toBe(0.10);
    });

    it('VIIRS_NOAA20_AOT_Deep_Blue_Best_Estimate has threshold 0.90', () => {
      expect(layerPixelData.VIIRS_NOAA20_AOT_Deep_Blue_Best_Estimate.threshold).toBe(0.90);
    });

    it('VIIRS_NOAA20_AOD_Dark_Target_Land_Ocean has threshold 0.90', () => {
      expect(layerPixelData.VIIRS_NOAA20_AOD_Dark_Target_Land_Ocean.threshold).toBe(0.90);
    });

    it('VIIRS_NOAA21_CorrectedReflectance_TrueColor has threshold 0.65', () => {
      expect(layerPixelData.VIIRS_NOAA21_CorrectedReflectance_TrueColor.threshold).toBe(0.65);
    });

    it('VIIRS_SNPP_NDVI_8Day has threshold 0.90', () => {
      expect(layerPixelData.VIIRS_SNPP_NDVI_8Day.threshold).toBe(0.90);
    });
  });
});

// ─── bestDates ────────────────────────────────────────────────────────────────

describe('bestDates', () => {
  describe('structure', () => {
    it('is an object', () => {
      expect(typeof bestDates).toBe('object');
      expect(bestDates).not.toBeNull();
    });

    it('every entry has a date string property', () => {
      Object.values(bestDates).forEach(({ date }) => {
        expect(typeof date).toBe('string');
      });
    });

    it('every entry has exactly one key (date)', () => {
      Object.values(bestDates).forEach((entry) => {
        expect(Object.keys(entry)).toEqual(['date']);
      });
    });

    it('every date string is non-empty', () => {
      Object.values(bestDates).forEach(({ date }) => {
        expect(date.length).toBeGreaterThan(0);
      });
    });
  });

  describe('individual layer best dates', () => {
    it('GOES-East_ABI_GeoColor has date 2023-10-30T23:50:00.000Z', () => {
      expect(bestDates['GOES-East_ABI_GeoColor'].date).toBe('2023-10-30T23:50:00.000Z');
    });

    it('GOES-West_ABI_GeoColor has date 2023-10-30T23:50:00.000Z', () => {
      expect(bestDates['GOES-West_ABI_GeoColor'].date).toBe('2023-10-30T23:50:00.000Z');
    });

    it('Himawari_AHI_Band3_Red_Visible_1km has date 2023-10-30T23:50:00.000Z', () => {
      expect(bestDates.Himawari_AHI_Band3_Red_Visible_1km.date).toBe('2023-10-30T23:50:00.000Z');
    });

    it('MODIS_Terra_CorrectedReflectance_TrueColor has date 2023-10-29', () => {
      expect(bestDates.MODIS_Terra_CorrectedReflectance_TrueColor.date).toBe('2023-10-29');
    });

    it('VIIRS_SNPP_DayNightBand_At_Sensor_Radiance has date 2023-10-30', () => {
      expect(bestDates.VIIRS_SNPP_DayNightBand_At_Sensor_Radiance.date).toBe('2023-10-30');
    });

    it('VIIRS_SNPP_CorrectedReflectance_TrueColor has date 2023-10-30', () => {
      expect(bestDates.VIIRS_SNPP_CorrectedReflectance_TrueColor.date).toBe('2023-10-30');
    });

    it('IMERG_Precipitation_Rate has date 2023-10-30', () => {
      expect(bestDates.IMERG_Precipitation_Rate.date).toBe('2023-10-30');
    });

    it('GHRSST_L4_MUR_Sea_Surface_Temperature has date 2023-10-30', () => {
      expect(bestDates.GHRSST_L4_MUR_Sea_Surface_Temperature.date).toBe('2023-10-30');
    });

    it('MODIS_Aqua_Land_Surface_Temp_Day has date 2023-10-30', () => {
      expect(bestDates.MODIS_Aqua_Land_Surface_Temp_Day.date).toBe('2023-10-30');
    });

    it('MODIS_Aqua_CorrectedReflectance_TrueColor has date 2023-10-29', () => {
      expect(bestDates.MODIS_Aqua_CorrectedReflectance_TrueColor.date).toBe('2023-10-29');
    });

    it('OMI_Nitrogen_Dioxide_Tropo_Column has date 2023-10-27', () => {
      expect(bestDates.OMI_Nitrogen_Dioxide_Tropo_Column.date).toBe('2023-10-27');
    });

    it('VIIRS_SNPP_AOD_Dark_Target_Land_Ocean has date 2023-10-29', () => {
      expect(bestDates.VIIRS_SNPP_AOD_Dark_Target_Land_Ocean.date).toBe('2023-10-29');
    });

    it('VIIRS_SNPP_AOT_Deep_Blue_Best_Estimate has date 2023-10-30', () => {
      expect(bestDates.VIIRS_SNPP_AOT_Deep_Blue_Best_Estimate.date).toBe('2023-10-30');
    });

    it('AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Night has date 2023-10-17', () => {
      expect(bestDates.AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Night.date).toBe('2023-10-17');
    });

    it('AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Day has date 2023-10-17', () => {
      expect(bestDates.AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Day.date).toBe('2023-10-17');
    });

    it('VIIRS_NOAA20_CorrectedReflectance_TrueColor has date 2023-10-30', () => {
      expect(bestDates.VIIRS_NOAA20_CorrectedReflectance_TrueColor.date).toBe('2023-10-30');
    });

    it('CERES_EBAF_TOA_Shortwave_Flux_All_Sky_Monthly has date 2023-10-30', () => {
      expect(bestDates.CERES_EBAF_TOA_Shortwave_Flux_All_Sky_Monthly.date).toBe('2023-10-30');
    });

    it('TEMPO_L3_NO2_Vertical_Column_Troposphere has date 2024-06-03T17:00:00.000Z', () => {
      expect(bestDates.TEMPO_L3_NO2_Vertical_Column_Troposphere.date).toBe('2024-06-03T17:00:00.000Z');
    });

    it('TEMPO_L3_Ozone_Column_Amount has date 2024-06-03T17:00:00.000Z', () => {
      expect(bestDates.TEMPO_L3_Ozone_Column_Amount.date).toBe('2024-06-03T17:00:00.000Z');
    });

    it('VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance has date 2024-10-01', () => {
      expect(bestDates.VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance.date).toBe('2024-10-01');
    });

    it('VIIRS_NOAA20_DayNightBand_AtSensor_M15 has date 2024-10-01', () => {
      expect(bestDates.VIIRS_NOAA20_DayNightBand_AtSensor_M15.date).toBe('2024-10-01');
    });

    it('VIIRS_NOAA20_AOT_Deep_Blue_Best_Estimate has date 2024-10-01', () => {
      expect(bestDates.VIIRS_NOAA20_AOT_Deep_Blue_Best_Estimate.date).toBe('2024-10-01');
    });

    it('VIIRS_NOAA20_AOD_Dark_Target_Land_Ocean has date 2024-10-01', () => {
      expect(bestDates.VIIRS_NOAA20_AOD_Dark_Target_Land_Ocean.date).toBe('2024-10-01');
    });

    it('VIIRS_NOAA21_CorrectedReflectance_TrueColor has date 2024-10-01', () => {
      expect(bestDates.VIIRS_NOAA21_CorrectedReflectance_TrueColor.date).toBe('2024-10-01');
    });

    it('VIIRS_SNPP_NDVI_8Day has date 2025-08-24', () => {
      expect(bestDates.VIIRS_SNPP_NDVI_8Day.date).toBe('2025-08-24');
    });
  });
});

// ─── layersToMeasure ──────────────────────────────────────────────────────────

describe('layersToMeasure', () => {
  it('is an array', () => {
    expect(Array.isArray(layersToMeasure)).toBe(true);
  });

  it('has 26 entries', () => {
    expect(layersToMeasure).toHaveLength(26);
  });

  it('contains only strings', () => {
    layersToMeasure.forEach((layer) => {
      expect(typeof layer).toBe('string');
    });
  });

  it('has no duplicate entries', () => {
    expect(new Set(layersToMeasure).size).toBe(layersToMeasure.length);
  });

  it('contains MODIS_Terra_CorrectedReflectance_TrueColor', () => {
    expect(layersToMeasure).toContain('MODIS_Terra_CorrectedReflectance_TrueColor');
  });

  it('contains GOES-East_ABI_GeoColor', () => {
    expect(layersToMeasure).toContain('GOES-East_ABI_GeoColor');
  });

  it('contains GOES-West_ABI_GeoColor', () => {
    expect(layersToMeasure).toContain('GOES-West_ABI_GeoColor');
  });

  it('contains VIIRS_SNPP_NDVI_8Day', () => {
    expect(layersToMeasure).toContain('VIIRS_SNPP_NDVI_8Day');
  });

  it('contains TEMPO_L3_NO2_Vertical_Column_Troposphere', () => {
    expect(layersToMeasure).toContain('TEMPO_L3_NO2_Vertical_Column_Troposphere');
  });

  it('contains TEMPO_L3_Ozone_Column_Amount', () => {
    expect(layersToMeasure).toContain('TEMPO_L3_Ozone_Column_Amount');
  });

  it('every layer in layersToMeasure has a corresponding entry in layerPixelData', () => {
    layersToMeasure.forEach((layer) => {
      expect(layerPixelData).toHaveProperty(layer);
    });
  });
});

// ─── travelModeData ───────────────────────────────────────────────────────────

describe('travelModeData', () => {
  describe('structure', () => {
    it('is an object', () => {
      expect(typeof travelModeData).toBe('object');
      expect(travelModeData).not.toBeNull();
    });

    it('has 20 entries', () => {
      expect(Object.keys(travelModeData)).toHaveLength(20);
    });

    it('keys are numeric (1 through 20)', () => {
      const keys = Object.keys(travelModeData).map(Number);
      for (let i = 1; i <= 20; i += 1) {
        expect(keys).toContain(i);
      }
    });

    it('every entry has a title string', () => {
      Object.values(travelModeData).forEach(({ title }) => {
        expect(typeof title).toBe('string');
        expect(title.length).toBeGreaterThan(0);
      });
    });

    it('every entry has exactly one key (title)', () => {
      Object.values(travelModeData).forEach((entry) => {
        expect(Object.keys(entry)).toEqual(['title']);
      });
    });
  });

  describe('individual travel mode titles', () => {
    it('mode 1 is "True Color Imagery from Terra satellite"', () => {
      expect(travelModeData[1].title).toBe('True Color Imagery from Terra satellite');
    });

    it('mode 2 is "Geostationary imagery from NOAA and JAXA satellites"', () => {
      expect(travelModeData[2].title).toBe('Geostationary imagery from NOAA and JAXA satellites');
    });

    it('mode 3 is "Active fires detected by Suomi NPP satellite"', () => {
      expect(travelModeData[3].title).toBe('Active fires detected by Suomi NPP satellite');
    });

    it('mode 4 is "Black Marble Night Time Imaging from Suomi NPP satellite"', () => {
      expect(travelModeData[4].title).toBe('Black Marble Night Time Imaging from Suomi NPP satellite');
    });

    it('mode 5 is "Rain and Snow"', () => {
      expect(travelModeData[5].title).toBe('Rain and Snow');
    });

    it('mode 6 is "Sea Surface Temperature"', () => {
      expect(travelModeData[6].title).toBe('Sea Surface Temperature');
    });

    it('mode 7 is "Land Surface Temperature"', () => {
      expect(travelModeData[7].title).toBe('Land Surface Temperature');
    });

    it('mode 8 is "Arctic Sea Ice"', () => {
      expect(travelModeData[8].title).toBe('Arctic Sea Ice');
    });

    it('mode 9 is "Antarctic Sea Ice"', () => {
      expect(travelModeData[9].title).toBe('Antarctic Sea Ice');
    });

    it('mode 10 is "Active fires detected by NOAA-20 satellite"', () => {
      expect(travelModeData[10].title).toBe('Active fires detected by NOAA-20 satellite');
    });

    it('mode 11 is "Nitrogen Dioxide (NO2) by Aura satellite"', () => {
      expect(travelModeData[11].title).toBe('Nitrogen Dioxide (NO2) by Aura satellite');
    });

    it('mode 12 is "Carbon Monoxide (CO) by Aqua satellite"', () => {
      expect(travelModeData[12].title).toBe('Carbon Monoxide (CO) by Aqua satellite');
    });

    it('mode 13 is "Aerosol Optical Depth (AOD) by Suomi NPP satellite"', () => {
      expect(travelModeData[13].title).toBe('Aerosol Optical Depth (AOD) by Suomi NPP satellite');
    });

    it('mode 14 is "Nitrogen Dioxide Vertical Column Troposphere (L3) by TEMPO satellite"', () => {
      expect(travelModeData[14].title).toBe('Nitrogen Dioxide Vertical Column Troposphere (L3) by TEMPO satellite');
    });

    it('mode 15 is "Ozone Column Amount (L3) by TEMPO satellite"', () => {
      expect(travelModeData[15].title).toBe('Ozone Column Amount (L3) by TEMPO satellite');
    });

    it('mode 16 is "Black Marble Nighttime At Sensor Radiance from NOAA-20 satellite"', () => {
      expect(travelModeData[16].title).toBe('Black Marble Nighttime At Sensor Radiance from NOAA-20 satellite');
    });

    it('mode 17 is "Black Marble Nighttime Blue/Yellow Composite from NOAA-20 satellite"', () => {
      expect(travelModeData[17].title).toBe('Black Marble Nighttime Blue/Yellow Composite from NOAA-20 satellite');
    });

    it('mode 18 is "Aerosol Optical Depth (AOD) by NOAA-20 satellite"', () => {
      expect(travelModeData[18].title).toBe('Aerosol Optical Depth (AOD) by NOAA-20 satellite');
    });

    it('mode 19 is "Active Fires detected by NOAA-21 satellite"', () => {
      expect(travelModeData[19].title).toBe('Active Fires detected by NOAA-21 satellite');
    });

    it('mode 20 is "Vegetation Index (NDVI) by Suomi NPP satellite"', () => {
      expect(travelModeData[20].title).toBe('Vegetation Index (NDVI) by Suomi NPP satellite');
    });
  });
});
