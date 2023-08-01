import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { debounce } from 'lodash';
import { saveRotation } from '../../map/util';
import HoverTooltip from '../util/hover-tooltip';
import { refreshRotation } from '../../modules/map/actions';

const duration = 500;

function Rotation() {
  const [intervalId, setIntervalId] = useState(null);

  const map = useSelector((state) => state.map.ui.selected, shallowEqual);
  const proj = useSelector((state) => state.proj, shallowEqual);
  const rotation = useSelector((state) => state.map.rotation);
  const isDistractionFreeModeActive = useSelector((state) => state.ui.isDistractionFreeModeActive);
  const isMobile = useSelector((state) => state.screenSize.isMobileDevice);

  const currentRotation = Number(rotation * (180 / Math.PI)).toFixed();
  const isPolarProj = proj.id !== 'geographic' && proj.id !== 'webmerc';
  const rotationButtonClass = isMobile ? 'wv-rotation-buttons-mobile' : 'wv-rotation-buttons';

  const dispatch = useDispatch();
  const updateRotationState = (radians) => debounce(() => {
    dispatch(refreshRotation(radians));
  }, 100);

  const clearIntervalRotation = () => {
    clearInterval(intervalId);
  };

  const rotate = (degrees) => {
    const mapView = map.getView();
    const currentDeg = mapView.getRotation() * (180.0 / Math.PI);
    const newRotation = mapView.getRotation() - Math.PI / degrees;
    saveRotation(currentDeg, mapView);
    mapView.animate({ rotation: newRotation, duration });
    updateRotationState(newRotation);
  };

  const rotateOnClick = (radians) => {
    const newIntervalId = setInterval(() => {
      rotate(radians);
    }, duration);
    rotate(radians);
    setIntervalId(newIntervalId);
  };

  const resetRotation = () => {
    clearIntervalRotation();
    map.getView().animate({
      duration: 500,
      rotation: 0,
    });
  };

  return !isDistractionFreeModeActive && isPolarProj && (
    <div className={rotationButtonClass}>
      <button
        type="button"
        className="wv-map-rotate-left wv-map-zoom"
        onMouseDown={() => { rotateOnClick(10); }}
        onMouseUp={clearIntervalRotation}
        onMouseOut={clearIntervalRotation}
        onMouseMove={(e) => { e.stopPropagation(); }}
      >
        <HoverTooltip
          isMobile={isMobile}
          labelText="Rotate counterclockwise"
          placement="left"
          target=".wv-map-rotate-left"
        />
        <FontAwesomeIcon icon="undo" className="cursor-pointer" />
      </button>

      <button
        type="button"
        className="wv-map-reset-rotation wv-map-zoom"
        onMouseDown={resetRotation}
        onMouseUp={clearIntervalRotation}
        onMouseOut={clearIntervalRotation}
        onMouseMove={(e) => { e.stopPropagation(); }}
      >
        <HoverTooltip
          isMobile={isMobile}
          labelText="Reset rotation"
          placement="left"
          target=".wv-map-reset-rotation"
        />
        {currentRotation}
      </button>

      <button
        type="button"
        className="wv-map-rotate-right wv-map-zoom"
        onMouseDown={() => { rotateOnClick(-10); }}
        onMouseUp={clearIntervalRotation}
        onMouseOut={clearIntervalRotation}
        onMouseMove={(e) => { e.stopPropagation(); }}
      >
        <HoverTooltip
          isMobile={isMobile}
          labelText="Rotate clockwise"
          placement="left"
          target=".wv-map-rotate-right"
        />
        <FontAwesomeIcon icon="redo" className="cursor-pointer" />
      </button>
    </div>
  );
}

export default Rotation;
