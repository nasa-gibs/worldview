import React, { useState, useEffect } from 'react';
import * as olProj from 'ol/proj';
import {
  clone as lodashClone,
} from 'lodash';
import { containsExtent, isEmpty } from 'ol/extent';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CRS } from '../../modules/map/constants';

const isValidExtent = (extent) => {
  if (extent.length !== 4) return false;
  if (extent.some((number) => Number.isNaN(number))) return false;
  return true;
};

function Input({
  index, title, boundingBoxArray, onLatLongChange, inputNumber, viewExtent, crs,
}) {
  const [inputValue, setInputValue] = useState(inputNumber);
  const [isInvalid, setInputInvalid] = useState(false);

  useEffect(() => {
    setInputValue(inputNumber);
  }, [inputNumber]);

  const update = () => {
    try {
      const newInputValue = Number(inputValue);
      const newArray = lodashClone(boundingBoxArray);
      newArray[index] = newInputValue;
      const crsCorrectedExtent = olProj.transformExtent(newArray, CRS.GEOGRAPHIC, crs);

      if (containsExtent(viewExtent, crsCorrectedExtent)
      && isValidExtent(newArray)
      && !isEmpty(crsCorrectedExtent)
      && !Number.isNaN(newInputValue)) {
        onLatLongChange(newArray);
        setInputInvalid(false);
      } else {
        setInputValue(boundingBoxArray[index].toFixed(4));
        setInputInvalid(true);
        setTimeout(() => setInputInvalid(false), 4000);
      }
    } catch (e) {
      console.warn(e);
      setInputValue(boundingBoxArray[index].toFixed(4));
      setInputInvalid(true);
      setTimeout(() => setInputInvalid(false), 4000);
    }
  };

  /**
   * onKeyUp determine if the input if valid and
   * send new value to parent
   * @param {Object} e Event Object
   */
  const onKeyDown = (e) => {
    const { keyCode } = e;
    const entered = Number(keyCode) === 13;
    const tabbed = Number(keyCode) === 9;
    if (entered || tabbed) {
      update();
    }
  };

  return (
    <div className="field col-12 col-sm-6">
      <label htmlFor={`latlong-input-${index}`} className="wv-image-label-lat-lon w-100">{title}</label>
      <input
        type="text"
        onKeyDown={onKeyDown}
        name="min-latitude"
        id={`latlong-input-${index}`}
        className="input input-lat-long w-100"
        required
        value={inputValue}
        onBlur={update}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {isInvalid && (<span className="red-font invalid">Not Visible</span>)}
    </div>
  );
}

function LatLongSelect(props) {
  const {
    onLatLongChange, geoLatLong, viewExtent, crs,
  } = props;
  const boundingBoxArray = [geoLatLong[0][0], geoLatLong[0][1], geoLatLong[1][0], geoLatLong[1][1]];
  const [showCoordinates, setShowCoordinates] = useState(false);
  const coordText = showCoordinates ? 'Hide Coordinates' : 'Edit Coordinates';
  const [minLon, minLat, maxLon, maxLat] = boundingBoxArray.map((coord) => coord.toFixed(4).toString());

  return (
    <div className="wv-image-input-case">
      <div className="wv-image-input-title" onClick={() => { setShowCoordinates(!showCoordinates); }}>
        <span>{coordText}</span>
        <span
          title="Hide coordinates"
          className="wv-image-collapse-latlong"
        >
          <FontAwesomeIcon icon="caret-right" size="lg" rotation={showCoordinates ? 90 : 0} />
        </span>
      </div>
      {showCoordinates && (
        <>
          <div className="row">
            <div className="col-12">
              <h4 className="wv-image-input-subtitle">Top Right</h4>
              <div className="field-group field-group-bounding-box-top-right">
                <div className="row">
                  <Input
                    crs={crs}
                    viewExtent={viewExtent}
                    inputNumber={maxLat}
                    boundingBoxArray={boundingBoxArray}
                    onLatLongChange={onLatLongChange}
                    index={3}
                    title="max Latitude"
                  />
                  <Input
                    crs={crs}
                    viewExtent={viewExtent}
                    inputNumber={maxLon}
                    boundingBoxArray={boundingBoxArray}
                    onLatLongChange={onLatLongChange}
                    index={2}
                    title="max Longitude"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <p className="wv-image-input-subtitle">Bottom Left</p>
              <div className="field-group field-group-bounding-box-bottom-left">
                <div className="row">
                  <Input
                    crs={crs}
                    viewExtent={viewExtent}
                    inputNumber={minLat}
                    boundingBoxArray={boundingBoxArray}
                    onLatLongChange={onLatLongChange}
                    index={1}
                    title="min Latitude"
                  />
                  <Input
                    crs={crs}
                    viewExtent={viewExtent}
                    inputNumber={minLon}
                    boundingBoxArray={boundingBoxArray}
                    onLatLongChange={onLatLongChange}
                    index={0}
                    title="min Longitude"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default LatLongSelect;

const {
  number, array, func, string,
} = PropTypes;
LatLongSelect.propTypes = {
  onLatLongChange: func,
  geoLatLong: array,
  viewExtent: array,
  crs: string,
};
Input.propTypes = {
  onLatLongChange: func,
  index: number,
  title: string,
  boundingBoxArray: array,
  inputNumber: string,
  viewExtent: array,
  crs: string,
};
