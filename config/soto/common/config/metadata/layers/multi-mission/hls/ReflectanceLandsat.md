### Landsat 8/OLI Reflectance (Nadir BRDF-Adjusted, v1.5)
Temporal coverage: 15 January 2020 - Present

The Reflectance (Nadir BRDF Adjusted, v1.5) imagery layer from Landsat 8/OLI is a true-color or natural color image because this combination of wavelengths is similar to what the human eye would see. It consists of natural-looking images of land surface, oceanic and atmospheric features. The Reflectance (Nadir BRDF Adjusted, v1.5) imagery layer from Landsat 8/OLI provides 30m Nadir Bidirectional Reflectance Distribution Function (BRDF)-Adjusted Reflectance (NBAR) and is derived from the joint NASA/USGS Landsat 8 Operational Land Imager (OLI) data product through the Harmonized Landsat and Sentinel-2 (HLS) project.

The HLS project provides consistent surface reflectance data from the Operational Land Imager (OLI) aboard the joint NASA/USGS Landsat 8 satellite and the Multi-Spectral Instrument (MSI) aboard the European Union’s Copernicus Sentinel-2A and Sentinel-2B satellites. The combined measurements between Landsat 8, Sentinel-2A, and Sentinel-2B enable global observations of the land every 2-3 days at 30 meter (m) spatial resolution. The HLS project uses a set of algorithms to obtain seamless products from OLI and MSI that include atmospheric correction, cloud and cloud-shadow masking, spatial co-registration and common gridding, illumination and view angle normalization, and spectral bandpass adjustment.

The Reflectance (Nadir BRDF Adjusted, v1.5) imagery layer from Landsat 8/OLI product (L30) is available through the HLS project from the Operational Land Imager (OLI) aboard the Landsat 8. The sensor resolution is 30 m, imagery resolution is 30 m, and the temporal resolution is daily with a 16 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Sentinel 2A and Sentinel 2B imagery layer available.

Note: PROVISIONAL - The Harmonized Landsat and Sentinel-2 (HLS) data have not been validated for their science quality and should not be used in science research or applications.

References: [HLSS30 v015: HLS Sentinel-2 Multi-Spectral Instrument Surface Reflectance Daily Global 30 m](https://lpdaac.usgs.gov/products/hlss30v015/); [Harmonized Landsat Sentinel-2 (HLS) Product User Guide](https://lpdaac.usgs.gov/documents/878/HLS_User_Guide_V15_provisional.pdf)

### MGRS/HLS Grid
The MGRS/HLS Grid layer displays the tiling system for the Harmonized Landsat Sentinel-2 (HLS) data. It is based on the Universal Transverse Mercator (UTM) projection-based Military Grid Reference System (MGRS), and reprojected into Geographic projection.

The UTM system divides the Earth’s surface into 60 longitude zones, each 6° of longitude in width, numbered 1 to 60 from 180° West to 180° East. Each UTM zone is divided into latitude bands of 8°, labeled with letters C to X from South to North. A useful mnemonic is that latitude bands N and later are in the Northern Hemisphere. When zoomed into higher zoom levels, it is visible that each 6°x8° polygon (grid zone) is further divided into the 110km x 110km Sentinel-2 tiles labeled with letters. For example, tile 11SPC is in UTM zone 11, latitude band S (in Northern Hemisphere), and labeled P in the east-west direction and C in the south-north direction within grid zone 11S. Users should note that there is horizontal and vertical overlap of around 8-10 km between two adjacent tiles in the same UTM zone. The overlap between two adjacent tiles both straddling a UTM zone boundary may be much greater.

The MGRS/HLS Grid layer is a reference layer and does not change over time.

References: [Harmonized Landsat Sentinel-2 (HLS) Product User Guide](https://lpdaac.usgs.gov/documents/878/HLS_User_Guide_V15_provisional.pdf)