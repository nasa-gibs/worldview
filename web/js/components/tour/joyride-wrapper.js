import React, { useState, useEffect } from 'react';
// import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Joyride from 'react-joyride';

function JoyrideWrapper ({ tourSteps, currentTourStep, map }) {
  const currentStepObj = tourSteps[currentTourStep - 1];
  const joyrideProps = (currentStepObj || {}).joyride;
  if (!joyrideProps) {
    return null;
  }

  const {
    continuous,
    disableOverlayClose,
    spotlightClicks,
    steps,
  } = joyrideProps;

  const styleOptions = {
    arrowColor: '#ccc',
    backgroundColor: '#ccc',
    beaconSize: 44,
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: '#d54e21',
    spotlightShadow: '0 0 25px rgba(0, 0, 0, 0.75)',
    textColor: '#333',
    width: undefined,
    zIndex: 1050,
  };

  const [joyrideState, setJoyrideState] = useState({});
  // const [overlayTarget, setOverlayTarget] = useState(false);

  // useEffect(() => {
  //   if (overlayTarget) {
  //     overlayTarget.remove();
  //     setOverlayTarget(false);
  //   }
  // }, [currentTourStep]);

  useEffect(
    () => {
      const { step } = joyrideState;
      if (map && step && step.targetCoordinates) {
        const id = step.target.substr(1, step.target.length);
        const placeholderEl = document.querySelector(id) || document.createElement('span');
        const { topLeft, bottomRight } = step.targetCoordinates;
        let [x1, y1] = map.getPixelFromCoordinate(topLeft) || [0, 0];
        let [x2, y2] = map.getPixelFromCoordinate(bottomRight) || [0, 0];
        x1 = x1.toFixed(0);
        y1 = y1.toFixed(0);
        x2 = x2.toFixed(0);
        y2 = y2.toFixed(0);
        placeholderEl.id = id;
        placeholderEl.style.position = 'absolute';
        placeholderEl.style.top = `${y1}px`;
        placeholderEl.style.left = `${x1}px`;
        placeholderEl.style.height = `${x2 - x1}px`;
        placeholderEl.style.width = `${y2 - y1}px`;
        placeholderEl.style.backgroundColor = 'rgba(255, 0, 0, 0.25)';
        placeholderEl.style.zIndex = '0';
        placeholderEl.style.pointerEvents = 'none';

        if (!document.querySelector(step.target)) {
          document.querySelector('body').appendChild(placeholderEl);
          // setOverlayTarget(placeholderEl);
        }
      }
    },
  );

  const joyrideStateCallback = (jState) => {
    console.log(jState);
    setJoyrideState(jState);
  };

  return !steps ? null : (
    <Joyride
      steps={steps}
      continuous={continuous}
      spotlightClicks={spotlightClicks}
      disableOverlayClose={disableOverlayClose}
      styles={{ options: styleOptions }}
      callback={joyrideStateCallback}
      disableScrolling
    />
  );
}

// const mapStateToProps = (state) => {
//   const { map } = state;
//   return {
//     map: map.ui.selected,
//   };
// };

// export default connect(mapStateToProps)(JoyrideWrapper);
export default JoyrideWrapper;

JoyrideWrapper.propTypes = {
  currentTourStep: PropTypes.number,
  map: PropTypes.object,
  tourSteps: PropTypes.array,
};
