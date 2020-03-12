module.exports = {
  // animations
  activeAnimationWidget: '?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2018-04-04&z=3&v=-177.94712426144758,-46.546875,-5.14662573855243,53.015625&ab=on&as=2018-03-28&ae=2018-04-04&av=3&al=false',
  activeCustomColormap: '?p=geographic&l=AIRS_L2_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Day(palette=red_1)&t=2016-04-08&z=3&v=-223.875,-91.828125,162.84375,98.296875&ab=on&as=2016-03-25&ae=2016-04-08&av=3&al=false',
  animationProjectionRotated: '?p=arctic&l=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines&t=2016-12-09&z=3&v=-2764195.2298414493,-88762.12734933128,2589496.903095221,3893331.478195751&r=-18.0000&ab=on&as=2016-12-02&ae=2016-12-09&av=3&al=true',
  animationTooManyFrames: '?p=geographic&v=-52.43799794510461,-36.052394508901145,-33.34815419510461,-12.532863258901145&t=2019-06-24-T10%3A00%3A00Z&as=2018-06-24-T10%3A00%3A00Z&ae=2019-07-01-T10%3A00%3A00Z&ab=on',
  animationTooManyFramesCustomInterval: '?p=geographic&v=-52.43799794510461,-36.052394508901145,-33.34815419510461,-12.532863258901145&t=2019-06-13-T08%3A00%3A00Z&ics=true&ici=2&icd=3&as=2009-06-23-T10%3A00%3A00Z&ae=2019-07-01-T10%3A00%3A00Z&ab=on',

  // compare
  swipeAndAIsActive:
    '?ca=true&cm=swipe&cv=51&p=geographic&l=MODIS_Terra_CorrectedReflectance_TrueColor&l1=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2018-08-17-T00%3A00%3A00Z&z=3&t1=2018-08-16-T00%3A00%3A00Z&v=-127.6171875,-46.5556640625,31.7109375,53.0244140625',
  opacityAndBIsActive:
    '?ca=false&cm=opacity&p=geographic&l=MODIS_Terra_CorrectedReflectance_TrueColor&l1=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2018-08-17-T00%3A00%3A00Z&z=3&t1=2018-08-16-T00%3A00%3A00Z&v=-127.6171875,-46.5556640625,31.7109375,53.0244140625',
  spyAndBIsActive:
    '?ca=false&cm=spy&p=geographic&l=MODIS_Terra_CorrectedReflectance_TrueColor&l1=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2018-08-17-T00%3A00%3A00Z&z=3&t1=2018-08-16-T00%3A00%3A00Z&v=-127.6171875,-46.5556640625,31.7109375,53.0244140625',
  swipeAOD:
    '?ca=true&cm=swipe&cv=51&p=geographic&l=MODIS_Terra_CorrectedReflectance_TrueColor,MODIS_Terra_Aerosol&l1=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2018-08-17-T00%3A00%3A00Z&z=3&t1=2018-08-16-T00%3A00%3A00Z&v=-127.6171875,-46.5556640625,31.7109375,53.0244140625',

  // date
  knownDate: '?t=2019-07-22',

  // timeline
  subdailyLayerIntervalTimescale: '?t=2019-10-04-T09%3A46%3A32Z&z=4&i=4&l=GOES-East_ABI_Band2_Red_Visible_1km,Reference_Labels(hidden),Reference_Features(hidden),Coastlines,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor',

  // events
  eventsTabActive: '?e=true',
  mockEvents: '?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2018-05-02-T00%3A00%3A00Z&z=3&v=-409.00147812273656,-205.62883007565202,270.5880270080828,219.11461063111003&e=true&mockEvents=20170530',

  // layers
  multipleDataLayers: '?p=geographic&l=MODIS_Terra_Aerosol,MODIS_Terra_Brightness_Temp_Band31_Day&t=2017-03-22&z=3&v=136.07019188386334,14.722152527011556,155.59817576644127,24.312819167567586',
  continuousDataLayers: '?p=geographic&l=MODIS_Terra_Brightness_Temp_Band31_Day&t=2015-05-25&z=2&v=-42.148380855752734,42.13121723408824,22.122734950093943,85.16225953076464',
};
