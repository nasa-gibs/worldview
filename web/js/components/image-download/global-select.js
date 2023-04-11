import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import Checkbox from '../util/checkbox';

const GLOBAL_LAT_LONG_EXTENT = [-180, -90, 180, 90];

function GlobalSelectCheckbox(props) {
  const {
    onLatLongChange, geoLatLong, proj, map,
  } = props;

  const boundingBoxArray = [...geoLatLong[0], ...geoLatLong[1]];
  const globalSelected = isEqual(boundingBoxArray, GLOBAL_LAT_LONG_EXTENT);
  const [prevExtent, setPrevExtent] = useState(globalSelected ? [-40, -40, 40, 40] : boundingBoxArray);
  const onCheck = () => {
    const useExtent = globalSelected ? prevExtent : GLOBAL_LAT_LONG_EXTENT;
    setPrevExtent(boundingBoxArray);
    map.getView().setCenter([0, 0]);
    map.getView().setZoom(0);
    setTimeout(() => {
      onLatLongChange(useExtent);
    }, 50);
  };

  const globalIsNotSelected = GLOBAL_LAT_LONG_EXTENT.some((latLongValue, index) => latLongValue !== boundingBoxArray[index]);
  if (proj !== 'geographic') return null;

  return (
    <div className="p-1">
      <Checkbox
        onCheck={onCheck}
        checked={!globalIsNotSelected}
        id="image-global-cb"
        label="Select Entire Globe"
        classNames="image-gb-checkbox"
        tooltipPlacement="top"
      />
    </div>
  );
}
GlobalSelectCheckbox.propTypes = {
  onLatLongChange: PropTypes.func,
  geoLatLong: PropTypes.array,
  proj: PropTypes.string,
  map: PropTypes.object,
};

export default GlobalSelectCheckbox;

