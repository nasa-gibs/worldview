## Create an Embedded Worldview

To embed NASA Worldview into a web page, StoryMap, or other web-based product, use the following steps:

1. Go to Worldview: [worldview.earthdata.nasa.gov](https://worldview.earthdata.nasa.gov)
2. Set up the map in Worldview in the manner most useful for illustrating your story. For example, [this is a before and after comparison of fires in Australia](https://worldview.earthdata.nasa.gov/?v=144.23691073937437,-38.67969316481099,152.31732548681651,-34.58659747600989&l=Reference_Labels_15m,Reference_Features_15m(hidden),Coastlines_15m,MODIS_Terra_CorrectedReflectance_Bands721(hidden),MODIS_Aqua_CorrectedReflectance_Bands721(hidden),VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden)&lg=false&l1=VIIRS_SNPP_Thermal_Anomalies_375m_Day(hidden),Reference_Labels_15m,Reference_Features_15m(hidden),Coastlines_15m,MODIS_Terra_CorrectedReflectance_Bands721(hidden),MODIS_Aqua_CorrectedReflectance_Bands721(hidden),VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden)&lg1=false&ca=false&t=2019-01-14-T00%3A00%3A00Z&t1=2020-01-11-T00%3A00%3A00Z).
3. Click on the Share icon (second from the left) in the upper right corner.
4. Click on the "Embed" tab.
5. Click "Copy" to copy the HTML code with the current Worldview instance in an embeddable `<iframe>` inline element.
6. Add the HTML code to your webpage in the place where you want the Worldview map to appear.

Note: You will need to wrap the `<iframe>` code in a wrapper element (e.g., `<div>`) with your desired width, height, and any additional style changes. You can change the width and height from percent to px to make it fit your page. See [https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) for more information on the `<iframe>` inline element including an explanation of its attributes.

**Example `<iframe>` code:**
```<iframe src="https://worldview.earthdata.nasa.gov/?em=true" role="application" sandbox="allow-modals allow-scripts allow-same-origin allow-forms allow-popups" width="100%" height="100%" allow="fullscreen; autoplay;" loading="lazy"></iframe>```

## Limited Features in an Embedded Worldview
Compared to the full application, the embedded version of Worldview has intentionally limited functionality to give users a more streamlined experience. The following is a list of the features and button/tab interactions that are not available or altered in embed mode.

- Search places by location, Share this map, Switch projections, Take a snapshot, and Information buttons are disabled. These features have been replaced with a button that opens up a new tab with your current map view in the full featured Worldview.
- The welcome page and its tour stories are disabled.
- In the Layer List, layer grouping is disabled, the hidden layers are not displayed, and the options to change the opacity, thresholds, color palettes, disable/enable classifications, or other related settings are not available.
- The Events tab will only appear in the embedded version if both 1) the tab is selected and 2) and event is selected in Worldview before creating the `iframe` html code.
- Data Download is disabled.
- The Extended timeline and layer coverage panel are unavailable. However, it is still possible for users to change the date.
- The Export to Animation tool is disabled.
- The Measure Tool is disabled.

## Helpful Tips:
- Limit the number of layers included on the map to best convey your story, as layers cannot be turned on and off once embedded.
- Provide detailed captions on your webpage to explain what the embedded Worldview is showing.

