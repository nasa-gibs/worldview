The VIIRS+CrIS Band 33 Fusion Brightness Temperature (Day) layer is the VIIRS+CrIS fusion brightness temperature, measured in Kelvin (K).

The VIIRS+CrIS fusion process constructs MODIS-like infrared (IR) channel radiances and brightness temperatures for VIIRS at M-band (750m) spatial resolution, where brightness temperatures are constructed using the Aqua MODIS channel 33 (13.3-micron) spectral response function. The goal is to provide continuity of the MODIS IR absorption channel record by supplementing VIIRS with MODIS-like fusion channels through the JPSS series of satellites, as each platform has (or will have) both the VIIRS and CrIS sensors.

The fusion method consists of two steps: (a) performing a nearest-neighbor search using a k-d tree algorithm on split-window (11 and 12 µm) imager radiances to find for each VIIRS high-spatial-resolution (M-band data) pixel the five nearest in distance and radiance VIIRS low-spatial-resolution FOVs (M-band data averaged over the CrIS FOV), and (b) averaging the convolved sounder radiances at low spatial resolution for the five nearest neighbors selected in the previous step for each imager pixel. The term “convolved sounder radiances” refers to the process of applying a given spectral response function (SRF) to the sounder hyperspectral radiances. The fusion product uses SRFs defined for the MODIS sensor on the NASA Earth Observation System (EOS) Aqua satellite.

The fusion product is produced for each 6-minute granule. It performs best within the CrIS swath but is also produced to full VIIRS swath width.

The VIIRS+CrIS Band 33 Fusion Brightness Temperature layer is available from the joint NASA/NOAA Suomi National Polar orbiting Partnership (Suomi NPP) satellite. The sensor resolution is 750m, the imagery resolution is 1 km, and the temporal resolution is daily.

References: FSNRAD_L2_VIIRS_CrIS_SNPP [doi:10.5067/VIIRS/FSNRAD_L2_VIIRS_CRIS_SNPP.001](https://doi.org/10.5067/VIIRS/FSNRAD_L2_VIIRS_CRIS_SNPP.001)