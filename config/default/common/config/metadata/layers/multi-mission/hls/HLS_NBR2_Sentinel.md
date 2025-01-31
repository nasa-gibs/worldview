**NOTE: This layer is undergoing beta testing.**

The dynamically generated Normalized Burn Ratio 2 (NBR2) imagery layer modifies the Normalized Burn Ratio (NBR) to highlight water sensitivity in vegetation and may be useful in post-fire recovery studies. NBR2 is calculated as a ratio between the SWIR values, substituting the SWIR1 band for the NIR band used in NBR.

It is calculated using:

`NBR2 = (SWIR1 – SWIR2) / (SWIR1 + SWIR2)`

Specifically for Sentinel-2A and -2B:

`NBR2 = (Band 11 – Band 12) / (Band 11 + Band 12)`

The divergent purple to orange color palette depicts vegetated areas in shades of purple and burned areas in shades of orange.

The Reflectance imagery layer from Sentinel-2/MSI product (S30) is available through the HLS project from the Multi-Spectral Instrument (MSI) aboard the European Union’s Copernicus Sentinel-2A, Sentinel-2B, and Sentinel-2C satellites. The sensor resolution is 10, 20, and 60 m, imagery resolution is resampled to 30 m, and the temporal resolution is daily with a 5 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Landsat 8 and 9 imagery layer available.

On January 21, 2025, the Sentinel-2C satellite replaced Sentinel-2A satellite. This layer contains a mix of imagery from Sentinel-2A, Sentinel-2B, and Sentinel-2C.
- Sentinel-2A: November 28, 2015 to January 22, 2025
- Sentinel-2B: September 18, 2017 to Present
- Sentinel-2C: January 21, 2025 to Present

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is only available at higher zoom levels.

References: HLSS30 v002 [doi:10.5067/HLS/HLSS30.002](https://doi.org/10.5067/HLS/HLSS30.002)