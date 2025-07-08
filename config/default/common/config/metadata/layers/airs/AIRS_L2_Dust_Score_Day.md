#### Description
Dust score is determined from multiple tests that compare radiances in select AIRS spectral channels. Radiances measured in channels that are sensitive to dust are compared to radiances measured in channels that are not sensitive to dust. The differences between several pairs of channels are represented as a dust score. Higher scores indicate more certainty that dust is present. Dust is probable when the score is above 380. AIRS dust can also be a proxy for volcanic ash. Dust products derived from AIRS observations can indicate the possibility of volcanic activity, but more detailed analysis is required to confirm the presence of volcanic clouds or estimate the composition and quantity of materials in the clouds.

#### Image Resolution
2 km/pixel (AIRS Level 2 `dust_score` is nominally 13.5 km/pixel, the data has been resampled into a 32 km/pixel visualization.)

#### Data Product
Image initially produced with NRT data. Science quality image replaces NRT when available.<br>
Near Real-Time Product: `AIRS2SUP_NRT` (Aqua/AIRS L2 Near Real Time (NRT) Support Retrieval (AIRS-only) V7.0 at GES DISC)<br>
Science Quality Product: `AIRS2SUP` (qua/AIRS L2 Support Retrieval (AIRS-only) V7.0 at GES DISC)<br>
Field name: `dust_score`<br>
Resolution: 13.5 km/pixel at nadir

#### Coverage
Spatial Coverage: Global<br>
Overpasses: Twice daily (day and night)<br>
Orbit: Sun-synchronous polar; Equatorial crossing local time: Daytime 1:30 pm, Nighttime 1:30 am

Note: For the Arctic (EPSG:3413) and Antarctic (EPSG:3031) projections, there is no differentation between the Day and the Night layers, they both show the same imagery.

#### References
Data Product: AIRS2SUP_NRT [doi:10.5067/MOQOVNHNERGG](https://doi.org/10.5067/MOQOVNHNERGG); AIRS2SUP [doi:10.5067/APJ6EEN0PD0Z](https://doi.org/10.5067/APJ6EEN0PD0Z)