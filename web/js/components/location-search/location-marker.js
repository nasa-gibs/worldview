import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CoordinatesDialog from './coordinates-dialog';
import util from '../../util/util';

const getDialogTitle = (geocodeProperties) => {
  const { address, error } = geocodeProperties;
  let title;
  if (address && !error) {
    /* eslint-disable camelcase */
    const {
      Match_addr,
      City,
      Region,
      Subregion,
    } = address;
    if (City && Region) {
      title = `${City}, ${Region}`;
    } else if (Subregion && Region) {
      title = `${Subregion}, ${Region}`;
    } else {
      title = `${Match_addr}`;
    }
  }
  return title;
};

export default function LocationMarker ({
  reverseGeocodeResults, removeMarker, coordinatesObject, isMobile, dialogVisible = true,
}) {
  const { longitude, latitude } = coordinatesObject;
  const tooltipId = util.encodeId(`coordinates-map-marker_${longitude},${latitude}`);
  const coordinates = [latitude, longitude];
  const title = getDialogTitle(reverseGeocodeResults);
  const [showDialog, setShowDialog] = useState(dialogVisible);

  return (
    <div className="location-dialog-pin-wrapper ">
      {showDialog && (
        <CoordinatesDialog
          title={title}
          coordinates={coordinates}
          removeMarker={removeMarker}
          removeCoordinatesDialog={() => setShowDialog(false)}
          isMobile={isMobile}
          tooltipId={tooltipId}
        />
      )}
      <img
        id="marker-pin"
        src="images/map-pin.png"
        height="32"
        width="20"
        onClick={() => setShowDialog(true)}
      />
    </div>
  );
}

LocationMarker.propTypes = {
  reverseGeocodeResults: PropTypes.object,
  isMobile: PropTypes.bool,
  coordinatesObject: PropTypes.object,
  removeMarker: PropTypes.func,
  dialogVisible: PropTypes.bool,
};
