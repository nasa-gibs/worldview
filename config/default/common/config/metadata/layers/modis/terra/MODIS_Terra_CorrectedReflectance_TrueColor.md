True Color: Red = Band 1, Green = Band 4, Blue = Band 3

These images are called true-color or natural color because this combination of wavelengths is similar to what the human eye would see. The images are natural-looking images of land surface, oceanic and atmospheric features. The downside of this set of bands is that they tend to produce a hazy image.

The MODIS Corrected Reflectance imagery is available only as near real-time imagery. The imagery can be visualized in Worldview and the Global Imagery Browse Services (GIBS). The sensor resolution is 500 m and 250 m (Bands 1 and 2 have a sensor resolution of 250 m, Bands 3 – 7 have a sensor resolution of 500m, and Bands 8 - 36 are 1 km. Band 1 is used to sharpen Band 3, 4, 6, and 7), imagery resolution is 250 m, and the temporal resolution is daily.

### MODIS Corrected Reflectance vs. MODIS Surface Reflectance

The MODIS Corrected Reflectance algorithm utilizes MODIS Level 1B data (the calibrated, geolocated radiances). It is not a standard, science quality product. The purpose of this algorithm is to provide natural-looking images by removing gross atmospheric effects, such as Rayleigh scattering, from MODIS visible bands 1-7. The algorithm was developed by the original MODIS Rapid Response team to address the needs of the fire monitoring community who want to see smoke. Corrected Reflectance shows smoke more clearly than the standard Surface Reflectance product. In contrast, the MODIS Land Surface Reflectance product (MOD09) is a more complete atmospheric correction algorithm that includes aerosol correction, and is designed to derive land surface properties. In clear atmospheric conditions the Corrected Reflectance product is very similar to the MOD09 product, but they depart from each other in presence of aerosols. If you wish to perform a complete atmospheric correction, please do not use the Corrected Reflectance algorithm. An additional difference is that the Land Surface Reflectance product is only tuned for calculating the reflectance over land surfaces.

References: [NASA Earthdata - FAQ](https://earthdata.nasa.gov/faq#ed-CRvsSR);
[AMNH - Biodiversity Informatics, Band Combination](http://biodiversityinformatics.amnh.org/interactives/bandcombination.php); [NASA Earthdata - Creating Reprojected True Color MODIS Images: A Tutorial](https://earthdata.nasa.gov/files/MODIS_True_Color.pdf)
