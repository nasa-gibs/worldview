The MODIS Near Real-Time (NRT) Global Flood Product (MCDWD) provides a daily global map of flooding. It is derived from the NRT MODIS Surface Reflectance (MOD09) datasets from both the Terra and Aqua satellites. The Flood Product is available for 3 compositing periods: 1-day, 2-day, and 3-day. For each composite, water detections for all observations (Terra and Aqua) over the compositing period (1, 2, or 3 days) are accumulated, and if the total exceeds the required threshold, the pixel is marked as water. (Note: 1-day product not yet available in Worldview)

Users are advised to compare the flood product against the contributing MODIS reflectance imagery (such as 7-2-1 Corrected Reflectance; search for “721” after clicking “Add Layers”) , for the compositing period to ensure reported flood areas do not correspond to areas of cloud shadow. [Learn more...](https://earthdata.nasa.gov/earth-observation-data/near-real-time/mcdwd-nrt#ed-flood-faq)

As of January 12, 2023, a topographic filter has been applied to remove water detections from mountainous areas, greatly reducing the number of terrain shadow false-positives in such areas. These areas appear in all products as "Insufficient Data" (gray in default Worldview display).

#### Current Issues
- Far west tiles (Hawaii, Alaska):  Due to issues with processing imagery around the international dateline for this product, far west tiles will sometimes appear with data at the start of the day, long before Terra or Aqua have observed for the day. Users are advised to disregard such data, until the Corrected Reflectance layers confirm current-day observations have been processed.

#### Limitations
Prior to introduction of product Release 1 on April 16, 2024 the flood layers displayed a large number of flood pixels in the far north (generally above 60N latitude). Most of these are false-positive detections, resulting from the large number of overlapping images towards the poles in the source MODIS imagery (due to the nature of the spacecraft's polar orbit). Release 1 includes new compositing requirements that has greatly reduced, but not entirely eliminated, these false-positives. The archive product imagery available in Worldview until April 11, 2024 continues to contain these errors. Users are advised to consider the expected patterns of flooding, in order to more readily discern false-positives; real flooding is generally easily distinguishable by its spatial pattern (usually occurring along river courses or adjacent to existing water bodies). Whereas the false positives are generally scattered around randomly, or appear similar to cloud spatial patterns (not conforming to local hydrology).

Common situations in which the flood product may be unable to accurately identify flood include:

- Surface obscuration: clouds and canopy cover can block view of water on the surface. Buildings can also provide a “dry” roof, diluting the signal from surrounding water.
- Cloud shadow false-positives: cloud shadows are detected as water by the algorithm; when they recur in the same location over the compositing period, false positives are likely to be reported. Longer compositing periods help minimize this. Please check reflectance imagery of dates contributing to composite to rule these out, if reported flood looks unusual or suspicious.
- Terrain shadow false-positives: terrain shadows can create false-positives in mountains, generally only in wintertime. These are typically easy to identify due to their pattern (reflecting topography), and by comparison to reflectance imagery. As of January 12, 2023, a topographic filter has been applied which greatly reduces terrain shadow false-positives.
- Dark volcanic rock or soils: such areas can be identified as water, and thus will routinely be reported as flood.
- Springtime snow melt ponding on fields: such water can appear as pixelated flood across flat areas of agricultural fields. Although this is unusual water, it is often very shallow, and not moving, and thus typically not a flood in the normal sense. Checking the reflectance imagery will typically show such areas on the edge of larger areas of snow extent, or, looking back in time, will show them recently covered by snow.

#### Spatial Coverage
Non-polar global land areas (below 80 degrees latitude), comprising 287 10x10 degree tiles (see [product homepage](https://www.earthdata.nasa.gov/learn/find-data/near-real-time/modis-nrt-global-flood-product) for map of included tiles).

#### Sensor/Image Resolution
Nominal equatorial resolution is ~232 m per pixel, with resolution increasing toward the poles (~116 m at 60 degrees latitude). Note the higher apparent resolution towards the poles is simply an artifact of the lat/lon (geographic) projection used, and not intrinsic to the data.

#### Frequency
One product per day, per tile. During the day, data products are updated as NRT MOD09 data are received (an initial product may be updated if additional intersecting swath data is later received).

To help estimate if the final flood product (for the day) is available in Worldview for a given area of interest, users can check if both the Terra and Aqua Corrected Reflectance layers are displaying for the area. If they are, the flood product has likely also been updated (or will be within an hour).

Flood products displayed in Worldview are updated every 30 minutes, approximately on the hour and at 30 minutes past the hour.

References: MCDWD_L3_NRT [doi:10.5067/MODIS/MCDWD_L3_NRT.061](https://doi.org/10.5067/MODIS/MCDWD_L3_NRT.061)