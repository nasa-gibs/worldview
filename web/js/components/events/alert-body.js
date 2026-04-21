import React from 'react';

function EventsAlertModalBody() {
  return (
    <div className="basic-modal event-alert-modal-body">
      <h1>
        Why can’t I see an event?
      </h1>
      <p>
        There are a variety of factors as to why you may not be seeing an
        event in @NAME@ at the moment.
      </p>
      <ul>
        <li>
          Satellite overpass may have occurred before the event. Check out
          subsequent days or try a different satellite/sensor which has a
          different overpass time.
        </li>
        <li>Cloud cover may obscure the event.</li>
        <li>
          Some events don’t appear on the day that they are reported, you may
          have to wait a day or two for an event to become visible. Try and
          step through the days to see an event’s progression and/or change
          the satellite/sensor. NOTE: Wildfire events are currently set to
          automatically display the next day, as fire events often do not
          appear in the satellite imagery on the day they are reported.
        </li>
        <li>
          The resolution of the imagery may be too coarse to see an event.
        </li>
        <li>
          There are normal swath data gaps in some of the imagery layers due
          to way the satellite orbits the Earth, and an event may have
          occurred in the data gap. Learn more with the
          {' '}
          <a href="https://worldview.earthdata.nasa.gov/?v=-255.13947597940853,-142.5249083549454,242.67302402059147,109.63964770652301&l=Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&lg=false&tr=swath_gaps&t=2019-02-10-T00%3A00%3A00Z">
            Swath Gap tour story.
          </a>
        </li>
        <li>
          Events listings currently only go back to 1 January 2000.
        </li>
        <li>
          Not all categories have events that are populated back to 1 January 2000.
        </li>
      </ul>
      <p>
        Events are curated and provided by the
        {' '}
        <a href="https://eonet.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">
          Earth Observatory Natural Event Tracker
        </a>
      </p>
    </div>
  );
}

export default EventsAlertModalBody;
