**NOTE: This layer is undergoing beta testing.**

The dynamically generated Normalized Burn Ratio (NBR) imagery layer is used to delineate burned areas and measure the degree of fire effects (burn severity) within those areas. The water content present in healthy vegetation, saturated soils, open water bodies, etc. strongly absorbs shortwave infrared light while the structure of healthy vegetation strongly reflects near infrared light. NBR is calculated using the reflectance of the near infrared band (Band 5) and the 2.1 µm shortwave infrared band (Band 7) in HLS L30 imagery. It is calculated as a ratio between the NIR and SWIR values.

`NBR = (NIR - SWIR) / (NIR + SWIR)`

Specifically for Landsat 8 and 9:

`NBR = (Band 5 – Band 7) / (Band 5 + Band 7)`

The divergent purple to orange color palette depicts vegetated areas in shades of purple and burned areas in shades of orange.

NBR values range from -1 to 1. Decreasing NBR values within burned areas indicate increasing damage to vegetation density and vigor resulting from fire, increasing presence of ash from burned vegetation, and the increasing exposure of bare, dry soils and rocky areas. Recently burned areas present NBR values that are typically 0 to strongly negative. NBR values increasing from 0 to 1 represent increasingly healthy, undamaged vegetation only lightly burned or not at all affected by fire.

The Reflectance imagery layer from Landsat 8 and 9/OLI product (L30) is available through the HLS project from the Operational Land Imager (OLI) aboard the Landsat 8 and 9 satellites. The sensor resolution is 30 m, imagery resolution is 30 m, and the temporal resolution is daily with an 8 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Sentinel-2 imagery layer available.

Landsat 9 launched on September 27, 2021 and was subsequently added to the HLS product, availability of imagery from Landsat 8 and Landsat 9 is as follows:
- Landsat 8: April 11, 2013 - Present
- Landsat 9: May 31, 2022 - Present

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is only available at higher zoom levels.

References: HLSL30 v002 [doi:10.5067/HLS/HLSL30.002](https://doi.org/10.5067/HLS/HLSL30.002)