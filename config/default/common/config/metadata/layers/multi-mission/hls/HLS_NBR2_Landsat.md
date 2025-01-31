**NOTE: This layer is undergoing beta testing.**

The dynamically generated Normalized Burn Ratio 2 (NBR2) imagery layer modifies the Normalized Burn Ratio (NBR) to highlight water sensitivity in vegetation and may be useful in post-fire recovery studies. NBR2 is calculated as a ratio between the SWIR values, substituting the SWIR1 band for the NIR band used in NBR.

It is calculated using:

`NBR2 = (SWIR1 – SWIR2) / (SWIR1 + SWIR2)`

Specifically for Landsat 8 and 9:

`NBR2 = (Band 6 – Band 7) / (Band 6 + Band 7)`

The divergent purple to orange color palette depicts vegetated areas in shades of purple and burned areas in shades of orange.

The Reflectance imagery layer from Landsat 8 and 9/OLI product (L30) is available through the HLS project from the Operational Land Imager (OLI) aboard the Landsat 8 and 9 satellites. The sensor resolution is 30 m, imagery resolution is 30 m, and the temporal resolution is daily with an 8 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Sentinel-2A and Sentinel-2B imagery layer available.

Landsat 9 launched on September 21, 2021 and was subsequently added to the HLS product, availability of imagery from Landsat 8 and Landsat 9 is as follows:
- Landsat 8: April 11, 2013 - Present
- Landsat 9: May 31, 2022 - Present

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is only available at higher zoom levels.

References: HLSL30 v002 [doi:10.5067/HLS/HLSL30.002](https://doi.org/10.5067/HLS/HLSL30.002)