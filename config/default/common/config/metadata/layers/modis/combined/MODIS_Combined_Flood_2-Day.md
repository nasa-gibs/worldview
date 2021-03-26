The MODIS Near Real Time (NRT) Global Flood Product 2-day flood imagery layer provides a daily composited map of flooding globally. It is derived from the NRT MOD09 (Surface Reflectance) datasets from the MODIS instrument aboard the Terra and Aqua satellites. The Flood Product has imagery layers provided for 3 compositing periods (1-day, 2-day, and 3-day). For each composite period, water detections for all swaths (Terra and Aqua) over the compositing period (1, 2, or 3 days) are accumulated, and if the total exceeds the required threshold (1, 2, and 3 observations, respectively), the pixel is marked as water.

Buildings, canopy cover, cloud and cloud-shadow can obscure flood detection, and terrain shadow, cloud-shadow and volcanic rock can lead to false-positive flood detections.

It is advised to compare the flood products against the contributing MODIS Corrected Reflectance (or Surface Reflectance) imagery, to ensure reported flood areas do not correspond to areas of cloud shadow. For the 2-day product, the images for the current and previous date should be examined.  [Learn more...](https://earthdata.nasa.gov/earth-observation-data/near-real-time/mcdwd-nrt#ed-flood-faq)

#### Sensor/Image Resolution
Nominal equatorial resolution is ~232 m per pixel, and decreasing toward the poles (~116 m at 60 degrees latitude). Note the higher apparent resolution towards the poles is simply an artifact of the lat/lon (geographic) projection used, and not intrinsic to the data. The imagery resolution in Worldview/GIBS is 250 m.

#### Coverage
Non-polar global land areas (below 70 degrees latitude), comprising 223 10x10 degree tiles (see Figure 4 in User Guide for included tiles).

#### Frequency
One product per day, per tile. During the day, data products are updated as NRT MOD09 data are received (an initial product may be updated if additional intersecting swath data is later received).

[More information](https://earthdata.nasa.gov/earth-observation-data/near-real-time/mcdwd-nrt)
