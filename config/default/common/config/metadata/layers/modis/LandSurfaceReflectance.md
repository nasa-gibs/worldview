### MODIS (Terra/Aqua) Land Surface Reflectance (True Color)
Temporal Coverage: 24 February 2000 - present (Terra); 3 July 2002 - present (Aqua)

True Color: Red = Band 1, Green = Band 4, Blue = Band 3

These images are called true-color or natural color because this combination of wavelengths is similar to what the human eye would see. The images are natural-looking images of land surface, oceanic and atmospheric features.

The MODIS Land Surface Reflectance product is available from both the Terra (MOD09) and Aqua (MYD09) satellites. The sensor resolution is 500 m, imagery resolution is 500 m, and the temporal resolution is daily.

### MODIS (Terra/Aqua) Land Surface Reflectance (Bands 7, 2, 1)
Temporal Coverage: 24 February 2000 - present (Terra); 3 July 2002 - present (Aqua)

False Color: Red = Band 7, Green = Band 2, Blue = Band 1

This combination is most useful for distinguishing burn scars from naturally low vegetation or bare soil and enhancing floods. Vegetation will appear green and burned areas will appear reddish.

The MODIS Land Surface Reflectance product is available from both the Terra (MOD09) and Aqua (MYD09) satellites. The sensor resolution is 500 m, imagery resolution is 500 m, and the temporal resolution is daily.

#### Vegetation and bare ground
Vegetation is very reflective in the near infrared (Band 2), and absorbent in Band 1 and Band 7. Assigning that band to green means even the smallest hint of vegetation will appear bright green in the image. Naturally bare soil, like a desert, is reflective in all bands used in this image, but more so in the SWIR (Band 7, red) and so soils will often have a pinkish tinge.

#### Burned areas
When vegetation burns, burned area or fire-affected areas become characterized by deposits of charcoal and ash, removal of vegetation and/or alteration of vegetation structure. When bare soil is exposed, the brightness in Band 1 usually slightly increases, but that may be offset by the presence of black carbon residue. The near infrared (Band 2) will become darker, and Band 7 becomes more reflective. When assigned to red in the image, Band 7 will show burn scars as deep or bright red, depending on the type of vegetation burned, the amount of residue, or the completeness of the burn.

#### Water
Liquid water on the ground will be very dark since it absorbs in the red and the SWIR. Sediments in water appear dark blue. Ice and snow appear as bright turquoise. Clouds comprised of small water droplets scatter light equally in both the visible and the SWIR and will appear white. These clouds are usually lower to the ground and warmer. High and cold clouds are comprised of ice crystals and will appear turquoise.

### MODIS (Terra/Aqua) Land Surface Reflectance (Bands 1, 2, 1)
Temporal Coverage: 24 February 2000 - present (Terra); 3 July 2002 - present (Aqua)

False Color: Red = Band 1, Green = Band 2, Blue = Band 1

Vegetation is very reflective in the near infrared (Band 2), and absorbent in Band 1. Assigning band 2 to green means even the smallest hint of vegetation will appear bright green in the image. Liquid water on the ground will be very dark since it absorbs in the red and the SWIR and sediments in water appear pink. This band combination is good for identifying vegetation changes, drought and floods.

The MODIS Land Surface Reflectance product is available from both the Terra (MOD09) and Aqua (MYD09) satellites. The sensor resolution is 250 m, imagery resolution is 250 m, and the temporal resolution is daily.

### MODIS Corrected Reflectance vs. MODIS Surface Reflectance
The MODIS Corrected Reflectance algorithm utilizes MODIS Level 1B data (the calibrated, geolocated radiances). It is not a standard, science quality product. The purpose of this algorithm is to provide natural-looking images by removing gross atmospheric effects, such as Rayleigh scattering, from MODIS visible bands 1-7. The algorithm was developed by the original MODIS Rapid Response team to address the needs of the fire monitoring community who want to see smoke. Corrected Reflectance shows smoke more clearly than the standard Surface Reflectance product. In contrast, the MODIS Land Surface Reflectance product (MOD09) is a more complete atmospheric correction algorithm that includes aerosol correction, and is designed to derive land surface properties. In clear atmospheric conditions the Corrected Reflectance product is very similar to the MOD09 product, but they depart from each other in presence of aerosols. If you wish to perform a complete atmospheric correction, please do not use the Corrected Reflectance algorithm. An additional difference is that the Land Surface Reflectance product is only tuned for calculating the reflectance over land surfaces.

References: [MODAPS - MOD09](https://modaps.modaps.eosdis.nasa.gov/services/about/products/c6-nrt/MOD09.html);[MODAPS - MYD09](https://modaps.modaps.eosdis.nasa.gov/services/about/products/c6-nrt/MYD09.html); [NASA Earthdata - Creating Reprojected True Color MODIS Images: A Tutorial](https://earthdata.nasa.gov/files/MODIS_True_Color.pdf)
<<<<<<< HEAD

### MODIS (Terra/Aqua) Land Surface Reflectance (Level 2G, Daily, True Color)
Temporal coverage: 24 February 2000 - present (Terra); July 2002 - present (Aqua)

The MOD09GA/MYD09GA Version 6 product provides an estimate of the surface spectral reflectance of Terra/Aqua Moderate Resolution Imaging Spectroradiometer (MODIS) Bands 1 through 7, corrected for atmospheric conditions such as gasses, aerosols, and Rayleigh scattering. Provided along with the 500 meter (m) surface reflectance, observation, and quality bands are a set of ten 1 kilometer (km) observation bands and geolocation flags. The reflectance layers from the MOD09GA are used as the source data for many of the MODIS land products.  

References: [LP DAAC MOD09GA Version 6](https://lpdaac.usgs.gov/products/mod09gav006/); [LP DAAC MYD09GA Version 6](https://lpdaac.usgs.gov/products/myd09gav006/)

### MODIS (Terra/Aqua) Land Surface Reflectance (Level 3, 8-Day, True Color)
Temporal coverage: 26 February 2000 - present (Terra); July 2002 - present (Aqua)

The Moderate Resolution Imaging Spectroradiometer (MODIS) Terra MOD09A1/Aqua MYD09A1 Version 6 product provides an estimate of the surface spectral reflectance of Aqua MODIS Bands 1 through 7 corrected for atmospheric conditions such as gasses, aerosols, and Rayleigh scattering. Along with the seven 500 meter (m) reflectance bands are a quality layer and four observation bands. For each pixel, a value is selected from all the acquisitions within the 8-day composite period. The criteria for the pixel choice include cloud and solar zenith. When several acquisitions meet the criteria the pixel with the minimum channel 3 (blue) value is used.

References: [LP DAAC MOD09A1 Version 6](https://lpdaac.usgs.gov/products/mod09a1v006/); [LP DAAC MYD09A1 Version 6](https://lpdaac.usgs.gov/products/myd09a1v006/)

### MODIS (Terra/Aqua) Land Surface Reflectance (Level 3, 8-Day, Bands 7-2-1)
Temporal coverage: 26 February 2000 - present (Terra); July 2002 - present (Aqua)

The Moderate Resolution Imaging Spectroradiometer (MODIS) Terra MOD09A1/Aqua MYD09A1 Version 6 product provides an estimate of the surface spectral reflectance of Terra MODIS Bands 1 through 7 corrected for atmospheric conditions such as gasses, aerosols, and Rayleigh scattering. Along with the seven 500 meter (m) reflectance bands are two quality layers and four observation bands. For each pixel, a value is selected from all the acquisitions within the 8-day composite period. The criteria for the pixel choice include cloud and solar zenith. When several acquisitions meet the criteria the pixel with the minimum channel 3 (blue) value is used.  

References: [LP DAAC MOD09A1 Version 6](https://lpdaac.usgs.gov/products/mod09a1v006/); [LP DAAC MYD09A1 Version 6](https://lpdaac.usgs.gov/products/myd09a1v006/)

### MODIS (Terra/Aqua) Land Surface Reflectance (Level 3, 8-Day, Bands 1-2-1)
Temporal coverage: 26 February 2000 - present (Terra); July 2002 - present (Aqua)

The MOD09Q1/MYD09Q1 Version 6 product provides an estimate of the surface spectral reflectance of Terra/Aqua Moderate Resolution Imaging Spectroradiometer (MODIS) Bands 1 and 2, corrected for atmospheric conditions such as gasses, aerosols, and Rayleigh scattering. Provided along with the 250 meter (m) surface reflectance bands are two quality layers. For each pixel, a value is selected from all the acquisitions within the 8-day composite period. The criteria for the pixel choice include cloud and solar zenith. When several acquisitions meet the criteria the pixel with the minimum channel 3 (blue) value is used.  

References: [LP DAAC MOD09Q1 Version 6](https://lpdaac.usgs.gov/products/mod09q1v006/); [LP DAAC MYD09Q1 Version 6](https://lpdaac.usgs.gov/products/myd09q1v006/)
=======
>>>>>>> Add orbit track endpoints
