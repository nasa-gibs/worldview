#### Description
Dust score is determined from multiple tests that compare radiances in select AIRS spectral channels. Radiances measured in channels that are sensitive to dust are compared to radiances measured in channels that are not sensitive to dust. The differences between several pairs of channels are represented as a dust score. Higher scores indicate more certainty that dust is present. Dust is probable when the score is above 380. AIRS dust can also be a proxy for volcanic ash. Dust products derived from AIRS observations can indicate the possibility of volcanic activity, but more detailed analysis is required to confirm the presence of volcanic clouds or estimate the composition and quantity of materials in the clouds.

#### Image Resolution
2 km/pixel (AIRS Level 2 `dust_score` is nominally 13.5 km/pixel, the data has been resampled into a 32 km/pixel visualization.)

#### Data Product
Image initially produced with NRT data. Science quality image replaces NRT when available.<br>
Near Real-Time Product: `AIRS2SUP_NRT` (AIRS-Only Level 2 Near Real-Time Product) Version 7<br>
Science Quality Product: `AIRS2SUP` (AIRS-Only Level 2 Standard Product) Version 6<br>
Field name: `dust_score`<br>
Resolution: 13.5 km/pixel at nadir

#### Coverage
Spatial Coverage: Global<br>
Overpasses: Twice daily (day and night)<br>
Orbit: Sun-synchronous polar; Equatorial crossing local time: Daytime 1:30 pm, Nighttime 1:30 am

#### References
Data Product: AIRS2SUP_NRT [doi:10.5067/MOQOVNHNERGG](https://doi.org/10.5067/MOQOVNHNERGG); AIRS2SUP [doi:10.5067/Aqua/AIRS/DATA208](https://doi.org/10.5067/Aqua/AIRS/DATA208)