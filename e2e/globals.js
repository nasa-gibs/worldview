module.exports = {
  url: 'http://localhost:3000/',
  production: 'https://worldview.earthdata.nasa.gov/',
  querystrings: {
    'animation with custom colormap active': '?p=geographic&l=AIRS_CO_Total_Column_Day(palette=red_1)&t=2016-04-08&z=3&v=-223.875,-91.828125,162.84375,98.296875&ab=on&as=2016-03-25&ae=2016-04-08&av=3&al=false',
    'animation with polar projection rotated': '?p=arctic&l=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines&t=2016-12-09&z=3&v=-2764195.2298414493,-88762.12734933128,2589496.903095221,3893331.478195751&r=-18.0000&ab=on&as=2016-12-02&ae=2016-12-09&av=3&al=true',
    'continuous data layers': '?p=geographic&l=MODIS_Terra_Brightness_Temp_Band31_Day&t=2015-05-25&z=2&v=-42.148380855752734,42.13121723408824,22.122734950093943,85.16225953076464',
    'multiple data layers': '?p=geographic&l=MODIS_Terra_Aerosol,MODIS_Terra_Brightness_Temp_Band31_Day&t=2017-03-22&z=3&v=136.07019188386334,14.722152527011556,155.59817576644127,24.312819167567586',
    'events tab active': '?e=true'
  },
  selectors: {
    'info button': '.wv-layers-info',
    'options button': '.wv-layers-options',
    'info dialog': '[aria-describedby="wv-layers-info-dialog"]',
    'options dialog': '[aria-describedby="wv-layers-options-dialog"]',
    'layers search field': '#layers-search-input',
    'source info icon': '.layers-all-layer .fa-info-circle',
    'source metadata close button': '.source-metadata .metadata-more',
    'animation widget': '#wv-animation-widget',
    'animation button': '#animate-button',
    'animation resolution tooltip': '.wv-tooltip-case:first-child',
    'yearly resolution tooltip': '.wv-tooltip #yearly',
    'timeline set to years': '#zoom-years.depth-1',
    'create GIF button': '.fa-file-video-o.wv-animation-widget-icon',
    'GIF download icon': '.jcrop-holder .fa-download',
    'GIF results': '.gif-results-dialog-case img',
    'GIF results close button': '.wv-gif-results button.ui-dialog-titlebar-close',
    'list of events': '#wv-events ul.map-item-list',
    'first event': '#wv-events ul.map-item-list .item:first-child h4',
    'selected first event': '#wv-events ul.map-item-list .item-selected:first-child h4',
    'selected marker': '.marker-selected',
    'map markers': '.ol-viewport .marker',
    'modal close button': '.ui-dialog.ui-draggable.ui-resizable .ui-dialog-titlebar-close',
    'notification dismiss button': '.ui-dialog.notify-alert .fa-times',
    'first external event link': '#wv-events ul.map-item-list .item:first-child .natural-event-link:first-child',
    'overlay layer items': '#overlays li'
  },
  delay: 3000 // Acceptable delay in ms between performing actions and seeing results
};
