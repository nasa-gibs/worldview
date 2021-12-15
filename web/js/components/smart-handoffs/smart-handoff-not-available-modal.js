import React from 'react';

export default function SmartHandoffNotAvailableModal() {
  return (
    <div className="basic-modal">
      <h1>Why are some layers not available for download?</h1>
      <p>
        Data will not be available on dates outside of each layer&#39;s respective coverage date range.
        These layers will be hidden from the layers available to download.
      </p>
      <p>
        In addition, some layers in Worldview do not have corresponding source data products available for download.
        These include Geostationary, Reference, Orbit Tracks, Earth at Night, and MODIS Corrected Reflectance products.
      </p>
      <p>
        For a downloadable product similar to MODIS Corrected Reflectance,
        please try the MODIS Land Surface Reflectance layers available in Worldview.
        If you would like to generate MODIS Corrected Reflectance imagery yourself, please&nbsp;
        <a href="https://earthdata.nasa.gov/sites/default/files/field/document/MODIS_True_Color.pdf" target="_blank" rel="noreferrer">
          see this document
        </a>
        .
      </p>
      <p>
        If you would like to download only an image, please use the “camera” icon in the upper right.  Options include a georeferenced image snapshot in GeoTIFF, JPG with Worldfile, PNG with Worldfile, and KMZ formats.
      </p>
    </div>
  );
}
