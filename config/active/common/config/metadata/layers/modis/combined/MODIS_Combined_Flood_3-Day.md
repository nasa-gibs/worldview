The MODIS Near Real-Time (NRT) Global Flood Product (MCDWD) provides a daily global map of flooding. It is derived from the NRT MODIS Surface Reflectance (MOD09) datasets from both the Terra and Aqua satellites. The Flood Product is available for 3 compositing periods: 1-day, 2-day, and 3-day. For each composite, water detections for all observations (Terra and Aqua) over the compositing period (1, 2, or 3 days) are accumulated, and if the total exceeds the required threshold (1, 2, and 3 observations, respectively), the pixel is marked as water. (Note: 1-day product not yet available in Worldview)

Users are advised to compare the flood product against the contributing MODIS reflectance imagery (such as 7-2-1 Corrected Reflectance; search for “721” after clicking “Add Layers”) , for the compositing period to ensure reported flood areas do not correspond to areas of cloud shadow. [Learn more...](https://earthdata.nasa.gov/earth-observation-data/near-real-time/mcdwd-nrt#ed-flood-faq)

#### Limitations
Common situations in which the flood product may be unable to accurately identify flood include:

- Surface obscuration: clouds and canopy cover can block view of water on the surface. Buildings can also provide a “dry” roof, diluting the signal from surrounding water.
- Cloud shadow false-positives: cloud shadows are detected as water by the algorithm; when they recur in the same location over the compositing period, false positives are likely to be reported. Longer compositing periods help minimize this. Please check reflectance imagery of dates contributing to composite to rule these out, if reported flood looks unusual or suspicious.
- Terrain shadow false-positives: terrain shadows can create false-positives in mountains, generally only in wintertime. These are typically easy to identify due to their pattern (reflecting topography), and by comparison to reflectance imagery.
- Dark volcanic rock or soils: such areas can be identified as water, and thus will routinely be reported as flood.
- Springtime snow melt ponding on fields: such water can appear as pixellated flood across flat areas of agricultural fields. Although this is unusual water, it is often very shallow, and not moving, and thus typically not a flood in the normal sense. Checking the reflectance imagery will typically show such areas on the edge of larger areas of snow extent, or, looking back in time, will show them recently covered by snow.


#### Spatial Coverage
Non-polar global land areas (below 70 degrees latitude), comprising 223 10x10 degree tiles (see Figure 4 in [User Guide](https://earthdata.nasa.gov/files/MCDWD_UserGuide_RevA.pdf) for included tiles).

#### Sensor/Image Resolution
Nominal equatorial resolution is ~232 m per pixel, and decreasing toward the poles (~116 m at 60 degrees latitude). Note the higher apparent resolution towards the poles is simply an artifact of the lat/lon (geographic) projection used, and not intrinsic to the data.

#### Frequency
One product per day, per tile. During the day, data products are updated as NRT MOD09 data are received (an initial product may be updated if additional intersecting swath data is later received).

[Dataset doi:10.5067/MODIS/MCDWD_L3_NRT.061](https://doi.org/10.5067/MODIS/MCDWD_L3_NRT.061)