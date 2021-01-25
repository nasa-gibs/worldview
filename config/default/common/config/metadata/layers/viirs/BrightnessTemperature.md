### Brightness Temperature (Band I5, Day | Night)
Temporal coverage: 17 September 2017 - present (Suomi NPP); 25 April 2020 - present (NOAA-20)

The VIIRS Brightness Temperature, Band I5, Day | Night layer is the brightness temperature, measured in Kelvin (K), calculated from the top-of-the-atmosphere radiances. It does not provide an accurate temperature of either clouds nor the land surface, but it does show relative temperature differences which can be used to distinguish features both in clouds and over clear land. It can be used to distinguish land, sea ice, and open water over the polar regions during winter (in cloudless areas).

The VIIRS Brightness Temperature layer is calculated from VIIRS Calibrated Radiances and is available from the joint NASA/NOAA Suomi National Polar orbiting Partnership (Suomi NPP) satellite, which crosses the equator at approximately 13:30 PM (ascending node) and 1:30 AM (descending node) and the NOAA-20 (JPSS-1) satellite, which crosses the equator approximately 50 minutes prior to Suomi NPP, at approximately 12:40 PM (ascending node) and 12:40 AM (descending node). The sensor resolution is 375m, the imagery resolution is 250m, and the temporal resolution is daily.

References: [VIIRS SDR Users Guide](https://lpdaac.usgs.gov/documents/134/VNP03_User_Guide_V1.2.pdf)

### Band 33 Fusion Brightness Temperature (Day | Night)
Temporal coverage: 17 April 2012 - present (Suomi NPP); 17 February 2018 - present (NOAA-20)

The VIIRS+CrIS Band 33 Fusion Brightness Temperature (Day | Night) layers are the VIIRS+CrIS fusion brightness temperature, measured in Kelvin (K).

The VIIRS+CrIS fusion process constructs MODIS-like infrared (IR) channel radiances and brightness temperatures for VIIRS at M-band (750m) spatial resolution, where brightness temperatures are constructed using the Aqua MODIS channel 33 (13.3-micron) spectral response function. The goal is to provide continuity of the MODIS IR absorption channel record by supplementing VIIRS with MODIS-like fusion channels through the JPSS series of satellites, as each platform has (or will have) both the VIIRS and CrIS sensors.

The fusion method consists of two steps: (a) performing a nearest-neighbor search using a k-d tree algorithm on split-window (11 and 12 µm) imager radiances to find for each VIIRS high-spatial-resolution (M-band data) pixel the five nearest in distance and radiance VIIRS low-spatial-resolution FOVs (M-band data averaged over the CrIS FOV), and (b) averaging the convolved sounder radiances at low spatial resolution for the five nearest neighbors selected in the previous step for each imager pixel. The term “convolved sounder radiances” refers to the process of applying a given spectral response function (SRF) to the sounder hyperspectral radiances. The fusion product uses SRFs defined for the MODIS sensor on the NASA Earth Observation System (EOS) Aqua satellite.

The fusion product is produced for each 6-minute granule. It performs best within the CrIS swath but is also produced to full VIIRS swath width.

The VIIRS+CrIS Band 33 Fusion Brightness Temperature layer is available from the joint NASA/NOAA Suomi National Polar orbiting Partnership (Suomi NPP) satellite and NOAA 20 satellite. The sensor resolution is 750m, the imagery resolution is 1 km, and the temporal resolution is daily.