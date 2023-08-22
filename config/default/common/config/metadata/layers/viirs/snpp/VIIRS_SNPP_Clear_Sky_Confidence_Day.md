
The Clear Sky Confidence product is the output of a cloud mask designed to work on multiple imaging sensors. Data values range from 0->1 and represent a confidence that clear skies were observed. A value of 1.0 means very high confidence of clear sky. A value of 0.0 means very low confidence of clear sky, or very high confidence that cloudy skies were observed. Confidences <= 0.95 are considered to be cloudy or partially cloudy; hence, when viewing this product we would recommend setting the threshold from 0 -> 0.95. By doing that and having the base layer set as the Corrected Reflectance one can see how effective the product is at masking out clouds. Find out more about the [cloud mask product](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/CLDMSK_L2_VIIRS_SNPP/).

References: CLDMSK_L2_VIIRS_SNPP_NRT [doi:10.5067/VIIRS/CLDMSK_L2_VIIRS_SNPP_NRT.001](https://doi.org/10.5067/VIIRS/CLDMSK_L2_VIIRS_SNPP_NRT.001)