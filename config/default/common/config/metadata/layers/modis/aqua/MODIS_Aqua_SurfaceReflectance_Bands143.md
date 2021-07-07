True Color: Red = Band 1, Green = Band 4, Blue = Band 3

These images are called true-color or natural color because this combination of wavelengths is similar to what the human eye would see. The images are natural-looking images of land surface, oceanic and atmospheric features.

The MODIS Land Surface Reflectance product is available from both the Terra (MOD09) and Aqua (MYD09) satellites. The sensor resolution is 500 m, imagery resolution is 500 m, and the temporal resolution is daily.

### MODIS Corrected Reflectance vs. MODIS Surface Reflectance

The MODIS Corrected Reflectance algorithm utilizes MODIS Level 1B data (the calibrated, geolocated radiances). It is not a standard, science quality product. The purpose of this algorithm is to provide natural-looking images by removing gross atmospheric effects, such as Rayleigh scattering, from MODIS visible bands 1-7. The algorithm was developed by the original MODIS Rapid Response team to address the needs of the fire monitoring community who want to see smoke. Corrected Reflectance shows smoke more clearly than the standard Surface Reflectance product. In contrast, the MODIS Land Surface Reflectance product (MOD09) is a more complete atmospheric correction algorithm that includes aerosol correction, and is designed to derive land surface properties. In clear atmospheric conditions the Corrected Reflectance product is very similar to the MOD09 product, but they depart from each other in presence of aerosols. If you wish to perform a complete atmospheric correction, please do not use the Corrected Reflectance algorithm. An additional difference is that the Land Surface Reflectance product is only tuned for calculating the reflectance over land surfaces.

NOTE: We are reprocessing the entire MODIS Land imagery archive to collection 6.1 but currently the imagery is a mix of collection 6 and collection 6.1. Most of the imagery from mid-May 2021 onwards is collection 6.1 and older imagery is collection 6.

References: MOD09 NRT [doi:10.5067/MODIS/MOD09.NRT.061](https://doi.org/10.5067/MODIS/MOD09.NRT.061); MOD09 [doi:10.5067/MODIS/MOD09.061](https://doi.org/10.5067/MODIS/MOD09.061)
