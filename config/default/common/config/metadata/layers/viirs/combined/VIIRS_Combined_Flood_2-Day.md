The VIIRS Near Real-Time (NRT) Global Flood Product (VCDWD) provides a daily global map of flooding. It is derived from the NRT VIIRS Surface Reflectance (VJ109/VJ209) datasets from both the NOAA-20 and NOAA-21 satellites. Apart from the different source data, this product mirrors the MODIS Global Flood Product (MCDWD), which is also available in Worldview.

The Flood Product is available for 3 compositing periods: 1-day, 2-day, and 3-day. For each composite, water detections for all observations (from both satellites) over the compositing period (1, 2, or 3 days) are accumulated, and if the total exceeds a required threshold, the pixel is marked as water. (Note: 1-day product not yet available in Worldview). The threshold varies by product; the User Guide provides details.

Users are advised to compare the flood product against the contributing VIIRS reflectance imagery (such as the false-color M11-I2-I1 Corrected Reflectance; search for “M11-I2-I1” after clicking “Add Layers”), for the compositing period to ensure reported flood areas do not correspond to areas of cloud shadow. [Learn more…](https://www.earthdata.nasa.gov/data/instruments/viirs/near-real-time-data/nrt-global-flood-products)

A topographic filter is applied to remove water detections from areas that have sufficient topographic relief such that flood water would be unlikely to accumulate (e.g., mountainous areas), greatly reducing the number of terrain shadow false-positives. These areas appear in all products as "Insufficient Data" (gray in default Worldview display), which is also used to indicate when the clouds are blocking the view of the surface.

#### Current Issues
- Far west tiles (Hawaii, Alaska):  Due to issues with processing imagery around the international dateline for this product, far west tiles will sometimes appear with data at the start of the day, long before Terra or Aqua have observed for the day. Users are advised to disregard such data, until the Corrected Reflectance layers confirm current-day observations have been processed.

#### Limitations
Users are advised to consider the expected patterns of flooding, in order to more readily discern false-positives; real flooding is generally easily distinguishable by its spatial pattern (usually occurring along river courses, adjacent to existing water bodies, and in flat areas). Whereas the false positives are generally scattered around seemingly randomly, or similar to cloud spatial patterns (e.g., not conforming to local hydrology).

Common situations in which the flood product may be unable to accurately identify flood include:

- Surface obscuration: clouds and canopy cover can block view of water on the surface. Buildings in urban areas can also provide a “dry” roof, diluting signal from surrounding water.
- Cloud shadow false-positives: cloud shadows are detected as water by the algorithm; when they recur in the same location over the compositing period, false positives are likely to be reported. Longer compositing periods help minimize this. Please check reflectance imagery of dates contributing to composite to rule these out, if reported flood looks unusual or suspicious. The 1-day product is not viewable in Worldview because this is particularly problematic over a 1-day composite.
- Terrain shadow false-positives: terrain shadows can create false-positives in mountains, generally only in wintertime. Although we apply a topographic mask globally, it is possible some terrain shadows may persist in some areas. They are typically easy to identify due to their pattern (reflecting topography), and by comparison to reflectance imagery.
- Dark volcanic rock or soils: such areas can be identified as water, and thus will routinely be reported as flood.
- Springtime snow melt ponding on fields: such water can appear as pixelated flood across flat areas of agricultural fields. Although this is unusual water, it is often very shallow, and not moving, and thus typically not a flood of concern in the normal sense. Checking the reflectance imagery will typically show such areas on the edge of larger areas of snow extent, or, looking back in time, will show them recently covered by snow.

#### Spatial Coverage
Non-polar global land areas (below 80 degrees latitude), comprising 287 10x10 degree tiles (see [product homepage](https://www.earthdata.nasa.gov/data/instruments/viirs/near-real-time-data/nrt-global-flood-products) for map of included tiles).

#### Sensor/Image Resolution
The VIIRS sensor ground resolution is nominally 375 meters, but the product is delivered at 0.0020833 degrees resolution (~ 232 m at the equator, and higher resolution towards the poles). This is the same resolution as the MODIS flood product (MCDWD), and was chosen to facilitate rapid development of the VIIRS product from the MODIS codebase.

#### Frequency
Hourly and Daily: The hourly product (VCDWDG) is generated within 3 hours of initial data acquisition, which occurs in early to mid afternoon; any additional observations will trigger a product update, which are published to Worldview every 30 minutes (approximately on the hour and at 30 minutes past the hour). At the end of the day, the final hourly product becomes the daily product for that day (VCDWD), encompassing all observations for the day. The hourly/daily differentiation is transparent to Worldview users, but may impact the product file to download; only the VCDWDG is available during the current day.

To help estimate if the final flood product for the day, for a given area of interest, is being displayed in Worldview, users can check if both the NOAA-20 and NOAA-21 Corrected Reflectance layers are displaying for the area. If they are, the flood product has likely also been updated (or will be within an hour).

References:

Daily product: VCDWD_L3_NRT [doi:10.5067/VIIRS/VCDWD_L3_NRT.0021](https://doi.org/10.5067/VIIRS/VCDWD_L3_NRT.002)

Hourly update product: VCDWDG_L3_NRT [doi:10.5067/VIIRS/VCDWDG_L3_NRT.002](https://doi.org/10.5067/VIIRS/VCDWDG_L3_NRT.002)