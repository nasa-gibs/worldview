import React from 'react';

export const EventsAlertModalBody = () => (
  <div className="event-alert-modal-body">
    <h3 className="wv-data-unavailable-header">
      Why can’t I see an event?
    </h3>
    <p>
      There are a variety of factors as to why you may not be seeing an
      event in Worldview at the moment.
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
        scroll through the days to see an event’s progression and/or change
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
        occurred in the data gap.
      </li>
    </ul>
    <p>
      This is currently an experimental feature and we are working closely
      with the provider of these events, the
      {' '}
      <a href="https://eonet.sci.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">
        Earth Observatory Natural Event Tracker
      </a>
      , to refine this listing to only show events that are visible with our
      satellite imagery.
    </p>
  </div>
);
