import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Joyride from 'react-joyride';

const placeholderElements = [];

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

  // Add placeholder DOM elements based on map coordinates so Joyride can place
  // a beacon on them
  useEffect(() => {
    (steps || []).forEach((step) => {
      const { target, targetCoordinates } = step || {};
      const existingEl = document.querySelector(target);

      if (map && target && targetCoordinates && !existingEl) {
        const placeholderEl = document.createElement('span');
        const { topLeft, bottomRight } = targetCoordinates;
        let [x1, y1] = map.getPixelFromCoordinate(topLeft) || [0, 0];
        let [x2, y2] = map.getPixelFromCoordinate(bottomRight) || [0, 0];
        x1 = x1.toFixed(0);
        y1 = y1.toFixed(0);
        x2 = x2.toFixed(0);
        y2 = y2.toFixed(0);
        placeholderEl.id = target.substr(1, target.length);
        placeholderEl.style.position = 'absolute';
        placeholderEl.style.top = `${y1}px`;
        placeholderEl.style.left = `${x1}px`;
        placeholderEl.style.height = `${y2 - y1}px`;
        placeholderEl.style.width = `${x2 - x1}px`;
        placeholderEl.style.zIndex = '0';
        placeholderEl.style.pointerEvents = 'none';
        document.querySelector('body').appendChild(placeholderEl);
        placeholderElements.push(placeholderEl);
      }
    });
  }, [currentTourStep]);

  // When tour is complete, remove all placeholder elements
  useEffect(() => {
    if (tourComplete) {
      placeholderElements.forEach((element) => element.remove());
    }
  });

  return (
    <Joyride
      key={currentTourStep}
      steps={steps || []}
      continuous={continuous}
      spotlightClicks={spotlightClicks}
      disableOverlayClose={disableOverlayClose}
      styles={{ options: styleOptions }}
      disableScrolling
      debug
    />
  );
}

JoyrideWrapper.propTypes = {
  currentTourStep: PropTypes.number,
  map: PropTypes.object,
  tourComplete: PropTypes.bool,
  tourSteps: PropTypes.array,
};
