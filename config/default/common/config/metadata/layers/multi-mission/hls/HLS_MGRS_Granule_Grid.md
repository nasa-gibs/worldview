The MGRS/HLS Grid layer displays the tiling system for the Harmonized Landsat Sentinel-2 (HLS) data. It is based on the Universal Transverse Mercator (UTM) projection-based Military Grid Reference System (MGRS), and reprojected into Geographic projection.

The UTM system divides the Earth’s surface into 60 longitude zones, each 6° of longitude in width, numbered 1 to 60 from 180° West to 180° East. Each UTM zone is divided into latitude bands of 8°, labeled with letters C to X from South to North. A useful mnemonic is that latitude bands N and later are in the Northern Hemisphere. When zoomed into higher zoom levels, it is visible that each 6°8° polygon (grid zone) is further divided into the 110km x 110km Sentinel-2 tiles labeled with letters. For example, tile 11SPC is in UTM zone 11, latitude band S (in Northern Hemisphere), and labeled P in the east-west direction and C in the south-north direction within grid zone 11S. Users should note that there is horizontal and vertical overlap of around 8-10 km between two adjacent tiles in the same UTM zone. The overlap between two adjacent tiles both straddling a UTM zone boundary may be much greater.

The MGRS/HLS Grid layer is a reference layer and does not change over time.

References: [Harmonized Landsat Sentinel-2 (HLS) Product User Guide](https://lpdaac.usgs.gov/documents/770/HLS_User_Guide_V15_provisional.pdf)
