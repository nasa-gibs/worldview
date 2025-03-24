


Starting from August 6th in 2019, Sentinel-5P TROPOMI along-track high spatial resolution (~5.5km at nadir) has been implemented.
Starting from July 13th in 2020, five Sentinel-5P TROPOMI level-2 products including total and tropospheric column ozone, sulfur dioxide, CLOUD, and formaldehyde have been generated in processor version 2.
For data before August 6th of 2019, please check S5P_L2__SO2____1 data collection.
For data between August 6th of 2019 and July 13th of 2020, please check S5P_L2__SO2____HiR_1 data collection.
For data after July 13th of 2020, please check S5P_L2__SO2____HiR_2 data collection.

The Copernicus Sentinel-5 Precursor (Sentinel-5P or S5P) satellite mission is one of the European Space Agency's (ESA) new mission family - Sentinels, and it is a joint initiative between the Kingdom of the Netherlands and the ESA. The sole payload on Sentinel-5P is the TROPOspheric Monitoring Instrument (TROPOMI), which is a nadir-viewing 108 degree Field-of-View push-broom grating hyperspectral spectrometer, covering the wavelength of ultraviolet-visible (UV-VIS, 270nm to 495nm), near infrared (NIR, 675nm to 775nm), and shortwave infrared (SWIR, 2305nm-2385nm). Sentinel-5P is the first of the Atmospheric Composition Sentinels and is expected to provide measurements of ozone, NO2, SO2, CH4, CO, formaldehyde, aerosols and cloud at high spatial, temporal and spectral resolutions.

The retrieval algorithm for Sentinel-5P TROPOMI SO2 from ultraviolet spectral measurements is the Differential Optical Absorption Spectroscopy (DOAS) method. The relevant information of absorption cross section, instrument characteristics, cloud cover, and geolocation are utilized to derive SO2 slant column density (SCD). A sensitive spectral window of 312 to 326 nm is set as the baseline for the slant column fit with another two spectral windows (325 to 335 nm, 360 to 390 nm) to account for the non-linear effects in those high column amount cases. The SCD is then corrected with the empirical offsets to the systematic biases. The air mass factor (AMF) Look-up table has been created with the LIDORT radiative transfer model. The outputs of the DOAS algorithm are SO2 vertical column density (VCD), SCD, AMF, the DOAS-type averaging kernels (AK), and error estimates.

The Sulfur Dioxide (Total Vertical Column, L2, Daily) layer is available from the European Space Agency's (ESA) Sentinel-5P satellite. The sensor resolution is ~5.5km at nadir, the imagery resolution is 2 km, and the temporal resolution is daily.

References: S5P_L2__SO2____HiR [doi:10.5270/S5P-74eidii](https://doi.org/10.5270/S5P-74eidii)