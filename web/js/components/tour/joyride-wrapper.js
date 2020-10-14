import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Joyride, { STATUS, ACTIONS } from 'react-joyride';

const placeholderElements = [];
let key = 0;
let joyrideProps;

export default function JoyrideWrapper ({
  tourSteps, currentTourStep, map, tourComplete,
}) {
  const currentStepObj = tourSteps[currentTourStep - 1];
  const {
    continuous,
    disableOverlayClose,
    spotlightClicks,
    steps,
  } = (currentStepObj || {}).joyride || {};

  const styleOptions = {
    arrowColor: '#ccc',
    backgroundColor: '#ccc',
    beaconSize: 50,
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: '#d54e21',
    spotlightShadow: '0 0 25px rgba(0, 0, 0, 0.75)',
    textColor: '#333',
    width: undefined,
    zIndex: 1050,
  };

  const [elementPositionKey, setElementPositionKey] = useState(key);

  function setPlaceholderLocation (element, targetCoordinates) {
    if (!map) return;
    const { topLeft, bottomRight } = targetCoordinates;
    let [x1, y1] = map.getPixelFromCoordinate(topLeft) || [0, 0];
    let [x2, y2] = map.getPixelFromCoordinate(bottomRight) || [0, 0];
    x1 = x1.toFixed(0);
    y1 = y1.toFixed(0);
    x2 = x2.toFixed(0);
    y2 = y2.toFixed(0);
    element.style.top = `${y1}px`;
    element.style.left = `${x1}px`;
    element.style.height = `${y2 - y1}px`;
    element.style.width = `${x2 - x1}px`;
  }

  // Add placeholder DOM elements based on map coordinates so Joyride can place
  // a beacon on them
  function addPlaceholderElements() {
    (steps || []).forEach((step) => {
      const { target, targetCoordinates } = step || {};
      const existingEl = document.querySelector(target);
      if (map && target && targetCoordinates && !existingEl) {
        const placeholderEl = document.createElement('span');
        placeholderEl.id = target.substr(1, target.length);
        placeholderEl.style.position = 'absolute';
        placeholderEl.style.zIndex = '0';
        placeholderEl.style.pointerEvents = 'none';
        setPlaceholderLocation(placeholderEl, targetCoordinates);
        document.querySelector('body').appendChild(placeholderEl);
        placeholderElements.push(placeholderEl);
      }
    });
  }

  function updateTargetsOnResize() {
    const { status, action } = joyrideProps || {};
    if (status === STATUS.FINISHED || action === ACTIONS.RESET) {
      return;
    }
    let needsUpdate = false;
    (steps || []).forEach((step) => {
      const { target, targetCoordinates } = step || {};
      const placeholderEl = document.querySelector(target);
      if (targetCoordinates) {
        needsUpdate = true;
        setPlaceholderLocation(placeholderEl, targetCoordinates);
      }
    });
    if (needsUpdate) {
      // eslint-disable-next-line no-plusplus
      setElementPositionKey(key++);
    }
  }

  useEffect(() => {
    addPlaceholderElements();
    map.getView().changed();
    // eslint-disable-next-line no-plusplus
    setElementPositionKey(key++);
  }, [currentTourStep]);
  useEffect(() => {
    if (!map) return;
    map.getView().on('change', updateTargetsOnResize);
    return () => map.getView().un('change', updateTargetsOnResize);
  });

  // When tour is complete, remove all placeholder elements
  useEffect(() => {
    if (tourComplete) {
      placeholderElements.forEach((element) => element.remove());
    }
  });

  return (
    <Joyride
      key={elementPositionKey}
      steps={steps || []}
      continuous={continuous}
      callback={(props) => { joyrideProps = props; }}
      spotlightClicks={spotlightClicks}
      disableOverlayClose={disableOverlayClose}
      styles={{ options: styleOptions }}
      disableScrolling
    />
  );
}

JoyrideWrapper.propTypes = {
  currentTourStep: PropTypes.number,
  map: PropTypes.object,
  tourComplete: PropTypes.bool,
  tourSteps: PropTypes.array,
};
