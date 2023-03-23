module.exports = {
  // animations
  activeAnimationWidget: 'http://localhost:3000/?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2018-04-04&z=3&v=-177.94712426144758,-46.546875,-5.14662573855243,53.015625&ab=on&as=2018-03-28&ae=2018-04-04&av=3&al=false',
  activeCustomColormap: 'http://localhost:3000/?p=geographic&l=AIRS_L2_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Day(palette=red_1)&t=2016-04-08&z=3&v=-223.875,-91.828125,162.84375,98.296875&ab=on&as=2016-03-25&ae=2016-04-08&av=3&al=false',
  animationProjectionRotated: 'http://localhost:3000/?p=arctic&l=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&t=2016-12-09&z=3&v=-2764195.2298414493,-88762.12734933128,2589496.903095221,3893331.478195751&r=-18.0000&ab=on&as=2016-12-02&ae=2016-12-09&av=3&al=true',
  animationTooManyFramesGif: 'http://localhost:3000/?p=geographic&v=-52.43799794510461,-36.052394508901145,-33.34815419510461,-12.532863258901145&t=2019-06-24-T10%3A00%3A00Z&as=2018-06-24-T10%3A00%3A00Z&ae=2019-07-01-T10%3A00%3A00Z&ab=on',
  animationTooManyFramesGifCustomInterval: 'http://localhost:3000/?p=geographic&v=-52.43799794510461,-36.052394508901145,-33.34815419510461,-12.532863258901145&t=2019-06-13-T08%3A00%3A00Z&ics=true&ici=2&icd=3&as=2009-06-23-T10%3A00%3A00Z&ae=2019-07-01-T10%3A00%3A00Z&ab=on',
  animationGeostationary: 'http://localhost:3000/?v=-127.54084611130202,-31.196051270164425,-36.29880238885806,62.96630766900102&z=4&ics=true&ici=5&icd=10&as=2021-12-03-T16%3A00%3A00Z&ae=2021-12-03-T17%3A10%3A00Z&l=GOES-East_ABI_GeoColor,Coastlines_15m&lg=true&al=true&ab=on&t=2021-12-01-T20%3A10%3A00Z',

  // compare
  swipeAndAIsActive:
    'http://localhost:3000/?ca=true&cm=swipe&cv=51&p=geographic&l=MODIS_Terra_CorrectedReflectance_TrueColor&l1=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2018-08-17-T00%3A00%3A00Z&z=3&t1=2018-08-16-T00%3A00%3A00Z&v=-127.6171875,-46.5556640625,31.7109375,53.0244140625',
  opacityAndBIsActive:
    'http://localhost:3000/?ca=false&cm=opacity&p=geographic&l=MODIS_Terra_CorrectedReflectance_TrueColor&l1=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2018-08-17-T00%3A00%3A00Z&z=3&t1=2018-08-16-T00%3A00%3A00Z&v=-127.6171875,-46.5556640625,31.7109375,53.0244140625',
  spyAndBIsActive:
    'http://localhost:3000/?ca=false&cm=spy&p=geographic&l=MODIS_Terra_CorrectedReflectance_TrueColor&l1=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2018-08-17-T00%3A00%3A00Z&z=3&t1=2018-08-16-T00%3A00%3A00Z&v=-127.6171875,-46.5556640625,31.7109375,53.0244140625',
  swipeAOD:
    'http://localhost:3000/?ca=true&cm=swipe&cv=51&p=geographic&l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol&l1=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2018-08-17-T00%3A00%3A00Z&z=3&t1=2018-08-16-T00%3A00%3A00Z&v=-127.6171875,-46.5556640625,31.7109375,53.0244140625',

  // date
  knownDate: 'http://localhost:3000/?t=2019-07-22',

  // timeline
  subdailyLayerIntervalTimescale: 'http://localhost:3000/?t=2019-10-04-T09%3A46%3A32Z&z=4&i=4&l=GOES-East_ABI_Band2_Red_Visible_1km,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor',

  // events
  mockEvents: 'http://localhost:3000/?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m&t=2018-05-02-T00%3A00%3A00Z&z=3&v=-409.00147812273656,-205.62883007565202,270.5880270080828,219.11461063111003&e=true&mockEvents=20170530',
  stormEventSelected: 'http://localhost:3000/?v=175.65863037109375,10.918751525878907,182.25042724609375,22.643360900878907&e=EONET_2777,2017-05-31&l=IMERG_Precipitation_Rate,VIIRS_SNPP_DayNightBand_ENCC(hidden),VIIRS_SNPP_DayNightBand_At_Sensor_Radiance(hidden),Reference_Labels,Reference_Features,Coastlines(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden)&lg=true&t=2017-05-31-T00%3A00%3A00Z&mockEvents=20170530',
  fixedAppNow: 'http://localhost:3000/?now=2012-01-01T00%3A00%3A00Z',
  wildfiresWithDates: 'http://localhost:3000/?v=-139.02635001706034,25.660099233568406,-85.27770827186355,43.288373996427595&e=true&efs=false&efd=2020-01-16,2020-06-16&efc=wildfires&t=2020-06-16-T18%3A31%3A28Z',
  backwardsCompatibleEventUrl: 'http://localhost:3000/?v=-49.6224609375,13.940234375000001,-26.5775390625,37.459765625&e=EONET_1874,2005-12-31&l=IMERG_Precipitation_Rate,Reference_Labels_15m,Reference_Features_15m,MODIS_Terra_CorrectedReflectance_TrueColor&lg=true&t=2005-12-31-T00%3A00%3A00Z',
  extentsUrl: 'http://localhost:3000/?e=true&efs=false',

  // layers
  multipleDataLayers: 'http://localhost:3000/?p=geographic&l=MODIS_Terra_Aerosol,MODIS_Terra_Brightness_Temp_Band31_Day&t=2017-03-22&z=3&v=136.07019188386334,14.722152527011556,155.59817576644127,24.312819167567586',
  continuousDataLayers: 'http://localhost:3000/?p=geographic&l=MODIS_Terra_Brightness_Temp_Band31_Day&t=2015-05-25&z=2&v=-42.148380855752734,42.13121723408824,22.122734950093943,85.16225953076464',
  referenceLayersOnly: 'http://localhost:3000/?l=Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m',

  // skip tour
  skipTour: 'http://localhost:3000/?lg=false&t=2023-02-28-T18%3A32%3A41Z'
}
