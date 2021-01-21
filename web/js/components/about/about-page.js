import React from 'react';
import Scrollbar from '../util/scrollbar';

export default function AboutPage() {
  return (

    <Scrollbar style={{ height: 'calc(100vh - 200px)' }}>
      <div id="page" className="wv-document">
        <div className="right">
          <div className="caption">
            Version @BUILD_VERSION@
            (
            <a href="https://github.com/nasa-gibs/worldview/releases" target="_blank" rel="noopener noreferrer">Release Notes</a>
            )
          </div>
        </div>

        <h1>
          Welcome to @NAME@
        </h1>

        <p>
          This app from NASA&apos;s
          {' '}
          <a href="https://earthdata.nasa.gov/eosdis" target="_blank" rel="noopener noreferrer">EOSDIS</a>
          {' '}
          provides the capability to interactively browse over 900 global, full-resolution satellite imagery
          layers and then download the underlying data. Many of the imagery layers are updated daily and are available within three hours
          of observation - essentially showing the entire Earth as it looks &quot;right now&quot;. This supports time-critical application
          areas such as wildfire management, air quality measurements, and flood monitoring. Arctic and Antarctic views
          of many products are also available for a &quot;full globe&quot; perspective. Geostationary imagery layers are also now available.
          These are provided in ten minute increments for the last 30 days. These full disk hemispheric views allow for almost real-time viewing of
          changes occurring around most of the world. Browsing on tablet and smartphone devices is generally supported for mobile access to the imagery.
        </p>

        <div className="right">
          <a href="https://earthdata.nasa.gov/gibs" className="gibs-logo" target="_blank" rel="noopener noreferrer"><img src="../../../pages/images/gibs.png" /></a>
          <div className="caption gibs-caption">Powered by GIBS</div>
        </div>

        <p>
          @NAME@ uses the
          {' '}
          <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noopener noreferrer">Global Imagery Browse Services</a>
          {' '}
          to rapidly retrieve its imagery for an interactive browsing experience. While
          {' '}
          @NAME@
          {' '}
          uses
          {' '}
          <a href="https://openlayers.org" target="_blank" rel="noopener noreferrer">OpenLayers</a>
          {' '}
          as its mapping library, GIBS imagery can also be accessed from Google Earth, NASA World Wind,
          and several other clients. We encourage interested developers to build their own clients or integrate NASA imagery
          into their existing ones using these services.
        </p>
        <p>
          <a href="https://earthdata.nasa.gov/faq/worldview-gibs-faq" target="_blank" rel="noopener noreferrer">Frequently Asked Questions</a>
        </p>
        <hr />
        <h2>Imagery Use</h2>
        <p>
          NASA supports an
          {' '}
          <a href="https://earthdata.nasa.gov/collaborate/open-data-services-and-software/data-information-policy" target="_blank" rel="noopener noreferrer">open data policy</a>
          {' '}
          and we encourage publication of imagery from
          {' '}
          @NAME@; when doing so for image captions, please cite it as &quot;NASA
          {' '}
          @NAME@
          &quot; and
          also consider including a direct link to the imagery in Worldview to allow others to explore the imagery.
        </p>
        <p>
          For acknowledgment in scientific journals, please use: &quot;We acknowledge the use of imagery from the NASA
          {' '}
          @NAME@
          {' '}
          application
          (
          <a href="https://worldview.earthdata.nasa.gov" target="_blank" rel="noopener noreferrer">https://worldview.earthdata.nasa.gov</a>
          ), part of the NASA Earth Observing System Data and Information System (EOSDIS).&quot;
        </p>
        <hr />
        <h2>Acknowledgements</h2>
        <p>
          With over 900 imagery layers, Worldview acknowledges the data providers of the near real-time (NRT) and standard quality imagery layers.
        </p>
        <p>
          While Worldview provides the highest priority products/parameters as decided by the data providers and users, not all NASA standard products (or all parameters within each product) are available via Worldview, see
          {' '}
          <a href="https://search.earthdata.nasa.gov/">Earthdata Search</a>
          {' '}
          for a full listing of available data products.
        </p>

        <p>
          Near real-time imagery is courtesy of the
          <a href="https://earthdata.nasa.gov/earth-observation-data/near-real-time" target="_blank" rel="noopener noreferrer"> Land, Atmosphere Near Real-Time Capability for EOS (LANCE) </a>
          data providers:
        </p>

        <ul>
          <li>
            <a href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/lance/about-amsr2-sips" target="_blank" rel="noopener noreferrer">AMSR SIPS</a>
          </li>
          <li>
            <a href="https://earthdata.nasa.gov/eosdis/daacs/asdc" target="_blank" rel="noopener noreferrer">ASDC</a>
          </li>
          <li>
            <a href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/lance/about-ges-disc" target="_blank" rel="noopener noreferrer">GES DISC</a>
          </li>
          <li>
            <a href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/lance/about-modaps" target="_blank" rel="noopener noreferrer">MODAPS</a>
          </li>
          <li>
            <a href="https://earthdata.nasa.gov/eosdis/sips/sips-mopitt" target="_blank" rel="noopener noreferrer">MOPITT SIPS</a>
          </li>
          <li>
            <a href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/lance/about-omi-sips" target="_blank" rel="noopener noreferrer">OMI SIPS</a>
            {' '}
            and
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/lance/about-ozone-sips" target="_blank" rel="noopener noreferrer">Ozone SIPS</a>
          </li>
          <li>
            <a href="https://earthdata.nasa.gov/earth-observation-data/near-real-time/firms" target="_blank" rel="noopener noreferrer">FIRMS</a>
          </li>
        </ul>

        <p>
          Standard quality/ Science quality imagery is courtesy of the
          {' '}
          <a href="https://earthdata.nasa.gov/eosdis/daacs" target="_blank" rel="noopener noreferrer">EOSDIS Distributed Active Archive Centers (DAACs)</a>
          :
        </p>
        <ul>
          <li>
            Atmospheric layers from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/asdc" target="_blank" rel="noopener noreferrer">ASDC DAAC</a>
          </li>
          <li>
            Atmospheric layers, modeled atmospheric layers and soil moisture layers from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/gesdisc" target="_blank" rel="noopener noreferrer">GES DISC</a>
          </li>
          <li>
            Hydrology related layers and Lightning layers from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/ghrc" target="_blank" rel="noopener noreferrer">GHRC DAAC</a>
          </li>
          <li>
            Level 1 MODIS and VIIRS Atmosphere and Land layers from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/laads" target="_blank" rel="noopener noreferrer">LAADS DAAC</a>
          </li>
          <li>
            Web Enabled Landsat Data (WELD) layers and Digital Elevation Models (DEMs) layers from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/lpdaac" target="_blank" rel="noopener noreferrer">LP DAAC</a>
          </li>
          <li>
            Snow and Ice layers, Freeze/Thaw and Soil Moisture layers from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/nsidc" target="_blank" rel="noopener noreferrer">NSIDC DAAC</a>
          </li>
          <li>
            Chlorophyll-a layers from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/obdaac" target="_blank" rel="noopener noreferrer">OB.DAAC</a>
          </li>
          <li>
            Daymet layers from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/ornl" target="_blank" rel="noopener noreferrer">ORNL DAAC</a>
          </li>
          <li>
            Ocean related layers like Sea Surface Temperature, Sea Surface Height and Sea Surface Salinity from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/podaac" target="_blank" rel="noopener noreferrer">PO.DAAC</a>
          </li>
          <li>
            Socioeconomic layers from
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/daacs/sedac" target="_blank" rel="noopener noreferrer">SEDAC</a>
          </li>
        </ul>
        <p>
          There are also many DAAC-specific tools for working directly with the data as listed here.
        </p>

        <p>
          Please also note that Worldview provides the “best available” layer information to users; this often means providing a “best” layer that prioritizes the composition of imagery products as follows: 1) Latest Version Standard Product; 2) Latest Version NRT; 3) Previous Version Standard Product; 4) Previous Version NRT.
          {' '}
          <a href="https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+API+for+Developers#GIBSAPIforDevelopers-%22BestAvailable%22Layers" target="_blank" rel="noopener noreferrer">Learn more about “Best Available” Layers from GIBS</a>
          .
        </p>

        <p>
          Other layers and information are provided by:
        </p>

        <ul>
          <li>
            Geostationary imagery layers are provided by the
            {' '}
            <a href="https://weather.msfc.nasa.gov/sport/" target="_blank" rel="noopener noreferrer">Short-term Prediction Research and Transition Center (SPoRT)</a>
            {' '}
            at NASA Marshall Space Flight Center.
          </li>
          <li>
            Precipitation products provided by
            {' '}
            <a href="https://pps.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">Precipitation Processing System (PPS)</a>
            {' '}
            and
            {' '}
            <a href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/lance/about-amsr2-sips" target="_blank" rel="noopener noreferrer">AMSR SIPS</a>
            .

          </li>
          <li>
            Orbit tracks provided by
            {' '}
            <a href="https://www.space-track.org" target="_blank" rel="noopener noreferrer">space-track.org</a>
            .
          </li>
          <li>
            Polar coastlines and graticules courtesy of
            {' '}
            <a href="https://www.add.scar.org/" target="_blank" rel="noopener noreferrer">SCAR Antarctic Digital Database</a>
            ,
            {' '}
            <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
            , and
            {' '}
            <a href="https://www.polarview.aq/" target="_blank" rel="noopener noreferrer">PolarView</a>
            .

          </li>
          <li>
            Coastlines, borders, roads, and place labels courtesy of
            {' '}
            <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
            {' '}
            and
            {' '}
            <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>
            . This data is available under the
            {' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              Open Database License
            </a>
            . &copy; OpenStreetMap contributors.

          </li>
          <li>
            Natural events database is provided by the
            {' '}
            <a href="https://eonet.sci.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">Earth Observatory Natural Event Tracker (EONET)</a>
            .
          </li>
          <li>
            User-selectable color palettes are primarily derived from:
            <ul>
              <li><a href="https://neo.sci.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">NEO</a></li>
              <li><a href="https://arxiv.org/abs/1509.03700" target="_blank" rel="noopener noreferrer">Peter Kovesi. Good Colour Maps: How to Design Them</a></li>
            </ul>
          </li>
          <li>The imagery ingest and serving system (GIBS) is built by NASA/JPL and operated by NASA/GSFC.</li>
          <li>
            @NAME@ is built by the NASA/GSFC
            {' '}
            <a href="https://earthdata.nasa.gov/esdis" target="_blank" rel="noopener noreferrer">Earth Science Data and Information System (ESDIS) Project</a>
            .
            We are grateful for the many third-party projects we depend on which are listed in
            {' '}
            <a href="https://github.com/nasa-gibs/worldview/blob/master/package.json" target="_blank" rel="noopener noreferrer">our package.json file</a>
            {' '}
            under &quot;dependencies&quot;.
          </li>
        </ul>

        <hr />
        <h2>Disclaimer</h2>
        <p>
          The information presented through this interface is provided &quot;as is&quot; and users bear all responsibility and liability for
          their use of the data. Please read the
          {' '}
          <a href="https://earthdata.nasa.gov/earth-observation-data/near-real-time/citation#ed-lance-disclaimer" target="_blank" rel="noopener noreferrer">full disclaimer</a>
          .
        </p>

        <hr />
        <h2>License</h2>
        <p>
          Copyright &copy; 2013 - 2021 United States Government as represented by the Administrator of the National Aeronautics and
          Space Administration. All Rights Reserved. This software is licensed under the
          {' '}
          <a href="https://ti.arc.nasa.gov/opensource/nosa/" target="_blank" rel="noopener noreferrer">NASA Open Source Software Agreement, Version 1.3</a>
          . Source code is available on the
          {' '}
          <a href="https://github.com/nasa-gibs/worldview" target="_blank" rel="noopener noreferrer">NASA GIBS GitHub</a>
          .
        </p>

        <hr />
        <p>
          @BUILD_TIMESTAMP@
          <br />
          {' '}
          Responsible NASA Official:
          {' '}
          <a href="mailto:ryan.a.boller@nasa.gov">Ryan Boller</a>
        </p>
      </div>
    </Scrollbar>
  );
}
