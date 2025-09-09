**NOTE: This layer is undergoing beta testing.**

The dynamically generated Normalized Difference Vegetation Index (NDVI) imagery layer is an index for quantifying green vegetation. NDVI is used to quantify vegetation greenness, understand vegetation density and monitor plant health. In healthy vegetation, chlorophyll strongly absorbs visible light while the structure of leaves strongly reflects near infrared light. NDVI is calculated using the reflectance of the red band (Band 4) and near infrared band (Band 8A) in HLS S30 imagery.

`NDVI = (B8-B4)/(B8+B4)`

The image is applied with a divergent blue-green to brown color palette. It depicts areas with a lot of green leaf growth, indicating the presence of chlorophyll, in dark green colors. Chlorophyll reflects more infrared light and less visible light. Areas with some green leaf growth are in light yellows, and areas with little to no vegetation growth are in shades of brown. NDVI values range from -1 to 1. Low NDVI values, at or near 0, generally correspond to barren areas (rock, sand, exposed soil, snow, etc.) while high NDVI values (0.8 to 0.9) represent greener, denser vegetation (forests, croplands, wetlands, etc.).

The Reflectance imagery layer from Sentinel-2/MSI product (S30) is available through the HLS project from the Multi-Spectral Instrument (MSI) aboard the European Union’s Copernicus Sentinel-2A, Sentinel-2B, and Sentinel-2C satellites. The sensor resolution is 10, 20, and 60 m, imagery resolution is resampled to 30 m, and the temporal resolution is daily with a 5 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Landsat 8 and 9 imagery layer available.

On January 21, 2025, the Sentinel-2C satellite replaced Sentinel-2A satellite. In addition, a [temporary one year extension campaign](https://sentinels.copernicus.eu/-/sentinel-2a-extended-campaign-starting-march-13-2025) of Sentinel-2A began on March 13, 2025. This campaign provides increased observations over Europe, and tropical regions of Africa and South America.

This layer contains a mix of imagery from Sentinel-2A, Sentinel-2B, and Sentinel-2C:
- Sentinel-2A: November 28, 2015 to January 22, 2025; March 14, 2025 to approximately March 2026.
- Sentinel-2B: September 18, 2017 to Present
- Sentinel-2C: January 21, 2025 to Present

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is only available at higher zoom levels.

References: HLSS30 v002 [doi:10.5067/HLS/HLSS30.002](https://doi.org/10.5067/HLS/HLSS30.002)