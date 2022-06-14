import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '../util/checkbox';

const MAX_LAT_LONG_EXTENT = [-180, -90, 180, 90];

const GlobalSelectCheckbox = (props) => {
  const { onLatLongChange, viewExtent, geoLatLong } = props;
  const BoundingBoxArray = [geoLatLong[0][0], geoLatLong[0][1], geoLatLong[1][0], geoLatLong[1][1]];
  const onCheck = () => onLatLongChange(MAX_LAT_LONG_EXTENT);
  const globalIsNotSelected = MAX_LAT_LONG_EXTENT.some((latLongValue, index) => latLongValue !== BoundingBoxArray[index]);
  // If full extent is not visible don't show checkbox
  const globalIsNotInView = MAX_LAT_LONG_EXTENT.some((latLongValue, index) => (index < 2 ? latLongValue < viewExtent[index] : latLongValue > viewExtent[index]));
  if (globalIsNotInView) return null;

  return (
    <div className="p-1">
      <Checkbox
        onCheck={onCheck}
        checked={!globalIsNotSelected}
        id="image-global-cb"
        label="Select Entire Globe"
      />
    </div>
  );
};
GlobalSelectCheckbox.propTypes = {
  onLatLongChange: PropTypes.func,
  viewExtent: PropTypes.array,
  geoLatLong: PropTypes.array,
};

export default GlobalSelectCheckbox;

