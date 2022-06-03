import React, { useState, useEffect } from 'react';
import {
  clone as lodashClone,
} from 'lodash';
import * as olExtent from 'ol/extent';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Input = ({
  index, title, BoundingBoxArray, onLatLongChange, inputNumber, viewExtent,
}) => {
  const [inputValue, setInputValue] = useState(inputNumber);
  const [isInvalid, setInputInvalid] = useState(false);
  useEffect(() => {
    setInputValue(inputNumber);
  }, [inputNumber]);
  /**
   * onKeyUp determine if the input if valid and
   * send new value to parent
   * @param {Object} e Event Object
   */
  const onKeyUp = (e) => {
    const { keyCode } = e;
    const entered = keyCode === 13;
    const tabbed = keyCode === 9;
    if (entered || tabbed) {
      const newArray = lodashClone(BoundingBoxArray);
      newArray[index] = Number(inputValue);
      const { isEmpty, containsExtent } = olExtent;
      if (containsExtent(viewExtent, newArray) && !isEmpty(newArray)) {
        onLatLongChange(newArray);
      } else {
        setInputValue(BoundingBoxArray[index].toFixed(4));
        setInputInvalid(true);
        setTimeout(() => setInputInvalid(false), 2000);
      }
    }
  };
  return (
    <div className="field col-12 col-sm-6">
      <label htmlFor={`latlong-input-${index}`} className="wv-image-label-lat-lon w-100">{title}</label>
      <input
        type="number"
        onKeyUp={onKeyUp}
        name="min-latitude"
        id={`latlong-input-${index}`}
        className="input input-lat-long w-100"
        required
        min="-180"
        max="180"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {isInvalid && (<span className="red">invalid input</span>)}
    </div>
  );
};

const LatLongSelect = (props) => {
  const { onLatLongChange, geoLatLong, viewExtent } = props;
  const BoundingBoxArray = [geoLatLong[0][0], geoLatLong[0][1], geoLatLong[1][0], geoLatLong[1][1]];
  const [showCoordinates, setShowCoordinates] = useState(true);
  const coordText = showCoordinates ? 'Hide Coordinates' : 'Edit Coordinates';
  return (
    <div className="wv-image-input-case">
      <div className="wv-image-input-title" onClick={() => { setShowCoordinates(!showCoordinates); }}>
        <span>{coordText}</span>
        <span title="Hide coordinates" className="wv-image-collapse-latlong"><FontAwesomeIcon icon="caret-right" size="lg" rotation={showCoordinates ? 90 : 0} /></span>
      </div>
      {showCoordinates && (
        <>
          <div className="row">
            <div className="col-12">
              <p className="wv-image-input-subtitle">Bottom Left</p>
              <div className="field-group field-group-bounding-box-bottom-left">
                <div className="row">
                  <Input viewExtent={viewExtent} inputNumber={BoundingBoxArray[0].toFixed(4)} BoundingBoxArray={BoundingBoxArray} onLatLongChange={onLatLongChange} index={0} title="min Latitude" />
                  <Input viewExtent={viewExtent} inputNumber={BoundingBoxArray[1].toFixed(4)} BoundingBoxArray={BoundingBoxArray} onLatLongChange={onLatLongChange} index={1} title="min Longitude" />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <h4 className="wv-image-input-subtitle">Top Right</h4>
              <div className="field-group field-group-bounding-box-top-right">
                <div className="row">
                  <Input viewExtent={viewExtent} inputNumber={BoundingBoxArray[2].toFixed(4)} BoundingBoxArray={BoundingBoxArray} onLatLongChange={onLatLongChange} index={2} title="max Latitude" />
                  <Input viewExtent={viewExtent} inputNumber={BoundingBoxArray[3].toFixed(4)} BoundingBoxArray={BoundingBoxArray} onLatLongChange={onLatLongChange} index={3} title="max Longitude" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default LatLongSelect;

const {
  number, array, func, string,
} = PropTypes;
LatLongSelect.propTypes = {
  onLatLongChange: func,
  geoLatLong: array,
  viewExtent: array,
};
Input.propTypes = {
  onLatLongChange: func,
  index: number,
  title: string,
  BoundingBoxArray: array,
  inputNumber: number,
  viewExtent: array,
};
