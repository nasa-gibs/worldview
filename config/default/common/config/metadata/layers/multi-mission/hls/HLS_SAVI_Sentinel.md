**NOTE: This layer is undergoing beta testing.**

The dynamically generated Soil Adjusted Vegetation Index (SAVI) imagery layer is used to correct Normalized Difference Vegetation Index (NDVI) for the influence of soil brightness in areas where vegetative cover is low. Surface Reflectance-derived SAVI is calculated as a ratio between the R and NIR values with a soil brightness correction factor (L) defined as 0.5 to accommodate most land cover types.

It is calculated using:

`SAVI = ((NIR - R) / (NIR + R + L)) * (1 + L)`

Specifically for Sentinel-2:

`SAVI = ((Band 8A – Band 4) / (Band 8A + Band 4 + 0.428)) * (1.428)`

The image is applied with a divergent blue-green to brown color palette. It depicts areas with a lot of green leaf growth, indicating the presence of chlorophyll, in dark green colors. Chlorophyll reflects more infrared light and less visible light. Areas with some green leaf growth are in light greens, and areas with little to no vegetation growth are in shades of brown.

The Reflectance imagery layer from Sentinel-2/MSI product (S30) is available through the HLS project from the Multi-Spectral Instrument (MSI) aboard the European Union’s Copernicus Sentinel-2A, Sentinel-2B, and Sentinel-2C satellites. The sensor resolution is 10, 20, and 60 m, imagery resolution is resampled to 30 m, and the temporal resolution is daily with a 5 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Landsat 8 and 9 imagery layer available.

On January 21, 2025, the Sentinel-2C satellite replaced Sentinel-2A satellite. In addition, a [temporary one year extension campaign](https://sentinels.copernicus.eu/-/sentinel-2a-extended-campaign-starting-march-13-2025) of Sentinel-2A began on March 13, 2025. This campaign provides increased observations over Europe, and tropical regions of Africa and South America.

This layer contains a mix of imagery from Sentinel-2A, Sentinel-2B, and Sentinel-2C:
- Sentinel-2A: November 28, 2015 to January 22, 2025; March 14, 2025 to approximately March 2026.
- Sentinel-2B: September 18, 2017 to Present
- Sentinel-2C: January 21, 2025 to Present

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is only available at higher zoom levels.

References: HLSS30 v002 [doi:10.5067/HLS/HLSS30.002](https://doi.org/10.5067/HLS/HLSS30.002)