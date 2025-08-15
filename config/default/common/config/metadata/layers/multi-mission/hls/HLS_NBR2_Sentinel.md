**NOTE: This layer is undergoing beta testing.**

The dynamically generated Normalized Burn Ratio 2 (NBR2) imagery layer is a variant of the Normalized Burn Ratio (NBR). It is used to highlight water sensitivity in vegetation and can potentially be used to assess post-fire vegetation conditions. The water content present in healthy vegetation, saturated soils, open water bodies, etc. are strongly absorbed by shortwave infrared light at 1.6 µm and 2.1 µm, relatively more so for the latter. The 1.6 µm band is particularly sensitive to moisture content within vegetation and can aid in discriminating between woody and non-woody vegetation types, while the 2.1 µm band provides additional overall sensitivity to moisture in vegetation and soils. NBR is calculated using the reflectance of the 1.6 µm shortwave infrared band (Band 11) and the 2.1 µm shortwave infrared band (Band 12) in HLS S30 imagery.

`NBR2 = (SWIR1 – SWIR2) / (SWIR1 + SWIR2)`

Specifically for Sentinel-2:

`NBR2 = (Band 11 – Band 12) / (Band 11 + Band 12)`

The divergent purple to orange color palette depicts vegetated areas in shades of purple and burned areas in shades of orange. NBR2 values range from -1 to 1. NBR2 values on this continuum generally provide similar information to the NBR. NBR2 values at 0 and progressively negative indicate increased vegetation damage and soil exposure resulting from fire while increasingly positive NBR2 values after a fire represent lightly damaged to unburned vegetation. NBR2 can aid in identifying small variations in the moisture content, health and stage of recovery for vegetation that has been affected by fire. Additionally, compared to other indices like the NBR, NBR2 can be more ideal for delineating the extent of burned areas and the mosaic of severity within those boundaries for fires occurring in particular biomes where the burn signal may be relatively more subtle. Such examples include grass/shrubland environments where the vegetation outside of the burned areas are senesced or herbaceous wetland areas and coastal marshes characterized by saturated soils.

The Reflectance imagery layer from Sentinel-2/MSI product (S30) is available through the HLS project from the Multi-Spectral Instrument (MSI) aboard the European Union’s Copernicus Sentinel-2A, Sentinel-2B, and Sentinel-2C satellites. The sensor resolution is 10, 20, and 60 m, imagery resolution is resampled to 30 m, and the temporal resolution is daily with a 5 day revisit time. The imagery is available in Worldview/GIBS approximately 2 - 4 days after satellite overpass. There is a separate combined Landsat 8 and 9 imagery layer available.

On January 21, 2025, the Sentinel-2C satellite replaced Sentinel-2A satellite. In addition, a [temporary one year extension campaign](https://sentinels.copernicus.eu/-/sentinel-2a-extended-campaign-starting-march-13-2025) of Sentinel-2A began on March 13, 2025. This campaign provides increased observations over Europe, and tropical regions of Africa and South America.

This layer contains a mix of imagery from Sentinel-2A, Sentinel-2B, and Sentinel-2C:
- Sentinel-2A: November 28, 2015 to January 22, 2025; March 14, 2025 to approximately March 2026.
- Sentinel-2B: September 18, 2017 to Present
- Sentinel-2C: January 21, 2025 to Present

This imagery layer is provided dynamically through the [NASA Interagency Implementation and Advanced Concepts Team (IMPACT)](https://www.earthdata.nasa.gov/about/impact). As it is dynamically generated, it may take slightly longer to display than normal. The imagery is only available at higher zoom levels.

References: HLSS30 v002 [doi:10.5067/HLS/HLSS30.002](https://doi.org/10.5067/HLS/HLSS30.002)