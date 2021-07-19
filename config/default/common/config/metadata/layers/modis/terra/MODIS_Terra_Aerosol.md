**4 May 2021 Notice**: The MODIS instrument aboard the Terra satellite experienced a Printed Wire Assembly (PWA) failure on 5 October 2020. This has resulted in a reduction in the overall Terra daytime coverage and many of the MODIS/Terra imagery layers have a slightly jagged appearance at the poles. This issue will affect land daytime MODIS/Terra products that primarily rely on the Reflective Solar Bands (RSB) (i.e. visible bands) indefinitely. [Learn more about the issue](https://landweb.modaps.eosdis.nasa.gov/cgi-bin/QA_WWW/displayCase.cgi?esdt=MOD&caseNum=PM_MOD_20280&caseLocation=cases_data&type=C6).

---

The Aerosol Optical Depth layer is useful for studying aerosol optical depth over the ocean as well as vegetation/dark-soiled land, which are both dark in the visible wavelengths. It is produced using two “Dark Target” (DT) algorithms for retrieving (1) over ocean (dark in visible and longer wavelengths) and (2) over vegetated/dark-soiled land (dark in the visible). Note: The algorithm is not applied over sunglint ocean regions or bright (desert) land regions, therefore gaps will occur at those locations.

The MODIS Aerosol Optical Depth layer uses the Optical Depth Land And Ocean parameter from both the Terra (`MOD04_L2`) and Aqua (`MYD04_L2`) satellites for daytime overpasses. The sensor/algorithm resolution is 10 km at nadir, the imagery resolution is 2 km at nadir, and the temporal resolution is daily. Resolution is much coarser out toward the edge of the swath.

