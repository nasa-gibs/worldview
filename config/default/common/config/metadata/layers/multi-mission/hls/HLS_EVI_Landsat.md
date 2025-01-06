**NOTE: This layer is undergoing beta testing.**

The dynamically generated Enhanced Vegetation Index (EVI) imagery layer is an index for quantifying green vegetation. EVI is similar to NDVI but corrects for some atmospheric conditions, canopy background noise, and is more sensitive to areas with dense vegetation. It reflects the state of vegetation health based on how vegetation reflects light at certain wavelengths.

It is calculated using:

`EVI = G * ((NIR - R) / (NIR + C1 * R – C2 * B + L))`

Specifically for Landsat 8 and 9:

`EVI = 2.5 * ((B5 – B4) / (B5 + 6 * B4 – 7.5 * B2 + 1))`

It incorporates an “L” value to adjust for canopy background, “C” values as coefficients for atmospheric resistance, and values from the blue band (B). These enhancements allow for index calculation as a ratio between the R and NIR values, while reducing the background noise, atmospheric noise, and saturation in most cases.

The image is applied with a divergent blue-green to brown color palette. It depicts areas with a lot of green leaf growth, indicating the presence of chlorophyll, in dark green colors. Chlorophyll reflects more infrared light and less visible light. Areas with some green leaf growth are in light yellows, and areas with little to no vegetation growth are in shades of brown.

The Reflectance imagery layer from Landsat 8 and 9/OLI product (L30) is available through the HLS project from the Operational Land Imager (OLI) aboard the Landsat 8 and 9 satellites. The sensor resolution is 30 m, imagery resolution is 30 m, and the temporal resolution is daily with an 8 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Sentinel-2A and Sentinel-2B imagery layer available.

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is also only available at higher zoom levels.

References: HLSL30 v002 [doi:10.5067/HLS/HLSL30.002](https://doi.org/10.5067/HLS/HLSL30.002)