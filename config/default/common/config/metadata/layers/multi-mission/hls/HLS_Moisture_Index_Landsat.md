**NOTE: This layer is undergoing beta testing.**

The dynamically generated Normalized Difference Moisture Index (NDMI) (B5-B6)/(B5+B6) imagery layer is an index to determine vegetation water content and monitor drought. It is calculated using near infrared and shortwave infrared (SWIR) wavelengths.

It is calculated using:

`NDMI = (B5-B6)/(B5+B6)`

The image is applied with a divergent blue to red color palette. Darker blue colors represent high canopy without water stress, and red colors are areas approaching water stress.

The Reflectance imagery layer from Landsat 8 and 9/OLI product (L30) is available through the HLS project from the Operational Land Imager (OLI) aboard the Landsat 8 and 9 satellites. The sensor resolution is 30 m, imagery resolution is 30 m, and the temporal resolution is daily with an 8 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Sentinel-2A and Sentinel-2B imagery layer available.

Landsat 9 launched on September 21, 2021 and was subsequently added to the HLS product, availability of imagery from Landsat 8 and Landsat 9 is as follows:
- Landsat 8: April 11, 2013 - Present
- Landsat 9: May 31, 2022 - Present

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is only available at higher zoom levels.

References: HLSL30 v002 [doi:10.5067/HLS/HLSL30.002](https://doi.org/10.5067/HLS/HLSL30.002)