**4 May 2021 Notice**: The MODIS instrument aboard the Terra satellite experienced a Printed Wire Assembly (PWA) failure on 5 October 2020. This has resulted in a reduction in the overall Terra daytime coverage and many of the MODIS/Terra imagery layers have a slightly jagged appearance at the poles. This issue will affect land daytime MODIS/Terra products that primarily rely on the Reflective Solar Bands (RSB) (i.e. visible bands) indefinitely. [Learn more about the issue](https://landweb.modaps.eosdis.nasa.gov/cgi-bin/QA_WWW/displayCase.cgi?esdt=MOD&caseNum=PM_MOD_20280&caseLocation=cases_data&type=C6).

---

False Color: Red = Band 1, Green = Band 2, Blue = Band 1

Vegetation is very reflective in the near infrared (Band 2), and absorbent in Band 1. Assigning band 2 to green means even the smallest hint of vegetation will appear bright green in the image. Liquid water on the ground will be very dark since it absorbs in the red and the SWIR and sediments in water appear pink. This band combination is good for identifying vegetation changes, drought and floods.

The MODIS Land Surface Reflectance product is available from both the Terra (MOD09) and Aqua (MYD09) satellites. The sensor resolution is 250 m, imagery resolution is 250 m, and the temporal resolution is daily.

### MODIS Corrected Reflectance vs. MODIS Surface Reflectance

The MODIS Corrected Reflectance algorithm utilizes MODIS Level 1B data (the calibrated, geolocated radiances). It is not a standard, science quality product. The purpose of this algorithm is to provide natural-looking images by removing gross atmospheric effects, such as Rayleigh scattering, from MODIS visible bands 1-7. The algorithm was developed by the original MODIS Rapid Response team to address the needs of the fire monitoring community who want to see smoke. Corrected Reflectance shows smoke more clearly than the standard Surface Reflectance product. In contrast, the MODIS Land Surface Reflectance product (MOD/MYD09) is a more complete atmospheric correction algorithm that includes aerosol correction, and is designed to derive land surface properties. In clear atmospheric conditions the Corrected Reflectance product is very similar to the MOD/MYD09 product, but they depart from each other in presence of aerosols. If you wish to perform a complete atmospheric correction, please do not use the Corrected Reflectance algorithm. An additional difference is that the Land Surface Reflectance product is only tuned for calculating the reflectance over land surfaces.

References: MOD09 NRT [doi:10.5067/MODIS/MOD09.NRT.061](https://doi.org/10.5067/MODIS/MOD09.NRT.061); MOD09 [doi:10.5067/MODIS/MOD09.061](https://doi.org/10.5067/MODIS/MOD09.061)