The Land Surface Temperature (L3, Daily, Day) layer shows the temperature of the land surface in Kelvin (K), from the Visible Infrared Imaging Radiometer Suite (VIIRS) aboard the joint NASA/NOAA NOAA-20 satellite.

The L2G process maps the daily VJ121 swath granules onto a sinusoidal MODIS grid and stores all observations overlapping a gridded cell for a given day. The VJ121A1 algorithm sorts through all these observations for each cell and estimates the final LST value as an average from all cloud-free observations that have good LST accuracies. The daytime average is weighted by the observation coverage for that cell. Only observations having observation coverage more than a certain threshold (15%) are considered for this averaging. The 1 kilometer dataset is derived through resampling the native 750 meter VIIRS resolution in the input product.

The VJ121A1D product is developed synergistically with the Moderate Resolution Imaging Spectroradiometer (MODIS) LST&E Version 6.1 product (MOD21A1D) using the same input atmospheric products and algorithmic approach. The overall objective for NASA VIIRS products is to ensure the algorithms and products are compatible with the MODIS Terra and Aqua algorithms to promote the continuity of the Earth Observation System (EOS) mission.

The sensor resolution is 750 m, imagery resolution is 1 km, and the temporal resolution is daily.

References: VJ121A1D [doi:10.5067/VIIRS/VJ121A1D.002](https://doi.org/10.5067/VIIRS/VJ121A1D.002)