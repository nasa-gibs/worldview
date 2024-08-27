**NOTE: This layer is undergoing beta testing.**

The dynamically generated Normalized Burn Ratio (NBR) imagery layer is used to identify burned areas and provide a measure of burn severity. It is calculated as a ratio between the NIR and SWIR values.

It is calculated using:

`NBR = (NIR - SWIR) / (NIR + SWIR)`

Specifically for Landsat 8 and 9:

`NBR = (Band 5 – Band 7) / (Band 5 + Band 7)`

The divergent purple to orange color palette depicts vegetated areas in shades of purple and burned areas in shades of orange.

The Reflectance imagery layer from Landsat 8 and 9/OLI product (L30) is available through the HLS project from the Operational Land Imager (OLI) aboard the Landsat 8 and 9 satellites. The sensor resolution is 30 m, imagery resolution is 30 m, and the temporal resolution is daily with an 8 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Sentinel-2A and Sentinel-2B imagery layer available.

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://earthdata.nasa.gov/esds/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is also only available at higher zoom levels.

References: HLSL30 v002 [doi:10.5067/HLS/HLSL30.002](https://doi.org/10.5067/HLS/HLSL30.002)