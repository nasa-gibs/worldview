**NOTE: This layer is undergoing beta testing.**

The dynamically generated Normalized Difference Moisture Index (NDMI) imagery layer is an index to determine vegetation water content and monitor drought. NDMI is sensitive to liquid water content in vegetation and can provide an indicator of vegetation stress due to drought. The water content present in healthy vegetation strongly absorbs shortwave infrared light while the structure of leaves strongly reflects near infrared light. NDMI is calculated using the reflectance of the “narrow” near infrared band (Band 8A) and 1.6 µm shortwave infrared band (Band 11) in HLS S30 imagery.

`NDMI = (B8A-B11)/(B8A+B11)`

The image is applied with a divergent blue to red color palette. Darker blue colors represent high canopy without water stress, and red colors are areas approaching water stress. NDMI values range from -1 to 1. Decreasing NDMI values for vegetated areas indicate increasingly less water content and increased stress due to drought with the lowest values generally corresponding to completely senesced vegetation or barren areas (rock, sand, exposed soil, built-up areas, etc.). High NDMI values represent healthy, unstressed vegetation (irrigated croplands, wetlands, lush forests, etc.).

The Reflectance imagery layer from Sentinel-2/MSI product (S30) is available through the HLS project from the Multi-Spectral Instrument (MSI) aboard the European Union’s Copernicus Sentinel-2A, Sentinel-2B, and Sentinel-2C satellites. The sensor resolution is 10, 20, and 60 m, imagery resolution is resampled to 30 m, and the temporal resolution is daily with a 5 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Landsat 8 and 9 imagery layer available.

On January 21, 2025, the Sentinel-2C satellite replaced Sentinel-2A satellite. In addition, a [temporary one year extension campaign](https://sentinels.copernicus.eu/-/sentinel-2a-extended-campaign-starting-march-13-2025) of Sentinel-2A began on March 13, 2025. This campaign provides increased observations over Europe, and tropical regions of Africa and South America.

This layer contains a mix of imagery from Sentinel-2A, Sentinel-2B, and Sentinel-2C:
- Sentinel-2A: November 28, 2015 to January 22, 2025; March 14, 2025 to approximately March 2026.
- Sentinel-2B: September 18, 2017 to Present
- Sentinel-2C: January 21, 2025 to Present

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is only available at higher zoom levels.

References: HLSS30 v002 [doi:10.5067/HLS/HLSS30.002](https://doi.org/10.5067/HLS/HLSS30.002)