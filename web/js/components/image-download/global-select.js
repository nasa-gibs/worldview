import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '../util/checkbox';

const GLOBAL_LAT_LONG_EXTENT = [-180, -90, 180, 90];

const GlobalSelectCheckbox = (props) => {
  const {
    onLatLongChange, viewExtent, geoLatLong, proj,
  } = props;
  const BoundingBoxArray = [geoLatLong[0][0], geoLatLong[0][1], geoLatLong[1][0], geoLatLong[1][1]];
  const onCheck = () => onLatLongChange(GLOBAL_LAT_LONG_EXTENT);
  const globalIsNotSelected = GLOBAL_LAT_LONG_EXTENT.some((latLongValue, index) => latLongValue !== BoundingBoxArray[index]);
  // If full extent is not visible don't show checkbox
  const globalIsNotInView = GLOBAL_LAT_LONG_EXTENT.some((latLongValue, index) => (index < 2 ? latLongValue < viewExtent[index] : latLongValue > viewExtent[index]));
  const title = globalIsNotInView ? 'Zoom out in order to select full globe' : 'Select Entire Globe';
  if (proj !== 'geographic') return null;

  return (
    <div className="p-1">
      <Checkbox
        onCheck={onCheck}
        checked={!globalIsNotSelected}
        id="image-global-cb"
        label="Select Entire Globe"
        disabled={globalIsNotInView}
        title={title}
        classNames="image-gb-checkbox"
        tooltipPlacement="top"
      />
    </div>
  );
};
GlobalSelectCheckbox.propTypes = {
  onLatLongChange: PropTypes.func,
  viewExtent: PropTypes.array,
  geoLatLong: PropTypes.array,
  proj: PropTypes.string,
};

export default GlobalSelectCheckbox;

