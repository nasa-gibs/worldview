import React from 'react';
import PropTypes from 'prop-types';

export default function LocationMarker ({ reverseGeocodeResults, addCoordinatesTooltip }) {
  return (
    <>
      <img
        id="marker-pin"
        src="images/map-pin.png"
        height="32"
        width="20"
        onClick={() => addCoordinatesTooltip(reverseGeocodeResults)}
      />
    </>
  );
}

LocationMarker.propTypes = {
  reverseGeocodeResults: PropTypes.object,
  addCoordinatesTooltip: PropTypes.func,
};
