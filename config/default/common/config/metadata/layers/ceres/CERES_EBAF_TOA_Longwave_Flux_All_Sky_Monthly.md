The TOA Longwave Flux (Monthly, Energy Balanced and Filled, All-Sky) layer is the Top of the Atmosphere (TOA, which CERES defines as the effective Earth-atmosphere disc found at 20 km altitude that captures the Sun's energy) outgoing radiance corresponding to longwave (3.5-50 µm) broadband channel for all-sky conditions. CERES footprints (20 km nominal resolution) are classified as clear if they contain 99% of pixels identified as clear by the CERES-MODIS clear-sky mask.

The CERES Energy Balanced and Filled (EBAF) layers are derived from CERES SYN1Deg products, and provide monthly mean radiative fluxes corresponding to collection either at the Earth’s surface (EBAF-Surface) or top-of-the-atmosphere (EBAF-TOA). EBAF-products were designed for climate model evaluation, estimating the Earth's global mean energy budget, and to infer meridional heat transport. For some climate modelers, the products address the need for a net imbalance constrained to the ocean heat storage term.

For EBAF surface fluxes, all-sky and clear-sky fluxes are calculated at all hourly increments during the month, regardless of cloud amount. For the all-sky condition, corresponding cloud type is specified for each pixel (e.g. ITCZ, maritime stratus, etc.). In regions with frequent cloudiness, it is possible that no clear-sky observations exist over a given month. Whereas the SSF1deg product, from which this product originates, does not attempt to fill in these non-measured clear-sky regions and default values are placed where there are no CERES observed clear-sky footprints in the spatial or temporal domain, the EBAF clear-sky filled product is a spatially complete clear-sky product.

The CERES TOA Longwave Flux (Monthly, Energy Balanced and Filled, All-Sky) layer is available from the CERES instruments on the Terra satellite. The sensor resolution is 1 degree, imagery resolution is 2 km, and the temporal resolution is monthly.

Data parameter: `toa_lw_all_mon`

References: CERES_EBAF-Sfc_Edition4.0 [doi:10.5067/TERRA+AQUA/CERES/EBAF-SURFACE_L3B004.0](https://doi.org/10.5067/TERRA+AQUA/CERES/EBAF-SURFACE_L3B004.0)
