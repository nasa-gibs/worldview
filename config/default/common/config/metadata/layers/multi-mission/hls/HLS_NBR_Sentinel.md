**NOTE: This layer is undergoing beta testing.**

The dynamically generated Normalized Burn Ratio (NBR) imagery layer is used to identify burned areas and provide a measure of burn severity. It is calculated as a ratio between the NIR and SWIR values.

It is calculated using:

`NBR = (NIR - SWIR) / (NIR + SWIR)`

Specifically for Sentinel-2A and -2B:

`NBR = (Band 8A – Band 12) / (Band 8A + Band 12)`

The divergent purple to orange color palette depicts vegetated areas in shades of purple and burned areas in shades of orange.

The Reflectance imagery layer from Sentinel-2A and Sentinel-2B/MSI product (S30) is available through the HLS project from the Multi-Spectral Instrument (MSI) aboard the European Union’s Copernicus Sentinel-2A and Sentinel-2B satellites. The sensor resolution is 10, 20, and 60 m, imagery resolution is resampled to 30 m, and the temporal resolution is daily with a 5 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Landsat 8 and 9 imagery layer available.

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is only available at higher zoom levels.

References: HLSS30 v002 [doi:10.5067/HLS/HLSS30.002](https://doi.org/10.5067/HLS/HLSS30.002)