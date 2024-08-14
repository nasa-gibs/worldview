**NOTE: This layer is undergoing beta testing.**

The dynamically generated Modified Soil Adjusted Vegetation Index (MSAVI) imagery layer minimizes the effect of bare soil on the Soil Adjusted Vegetation Index (SAVI). MSAVI is calculated as a ratio between the R and NIR values with an inductive L function applied to maximize reduction of soil effects on the vegetation signal.

It is calculated using:

`MSAVI = (2 * NIR + 1 – sqrt ((2 * NIR + 1)2 – 8 * (NIR - R))) / 2`

Specifically for Landsat 8 and 9:

`MSAVI = (2 * Band 5 + 1 – sqrt ((2 * Band 5 + 1)2 – 8 * (Band 5 – Band 4))) / 2`

The image is applied with a divergent blue-green to brown color palette. It depicts areas with a lot of green leaf growth, indicating the presence of chlorophyll, in dark green colors. Chlorophyll reflects more infrared light and less visible light. Areas with some green leaf growth are in light greens, and areas with little to no vegetation growth are in shades of brown.

The Reflectance imagery layer from Landsat 8 and 9/OLI product (L30) is available through the HLS project from the Operational Land Imager (OLI) aboard the Landsat 8 and 9 satellites. The sensor resolution is 30 m, imagery resolution is 30 m, and the temporal resolution is daily with an 8 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Sentinel-2A and Sentinel-2B imagery layer available.

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://earthdata.nasa.gov/esds/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is also only available at higher zoom levels.

References: HLSL30 v002 [doi:10.5067/HLS/HLSL30.002](https://doi.org/10.5067/HLS/HLSL30.002)