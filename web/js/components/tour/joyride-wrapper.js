import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import util from '../../util/util';

const { events } = util;
const placeholderElements = [];
let key = 0;
let joyrideProps;

/**
 *
 * @param {*} props
 */
export default function JoyrideWrapper ({
  tourSteps, currentTourStep, map, proj, tourComplete, resetProductPicker,
}) {
  if (!map) return null;
  const currentStepObj = tourSteps[currentTourStep - 1];
  const { stepLink } = currentStepObj;
  const projParam = stepLink.split('&').filter((param) => param.includes('p='));
  const stepProj = projParam.length ? projParam[0].substr(2) : 'geographic';
  const projMatches = stepProj === proj;
  const styles = {
    options: {
      arrowColor: '#ccc',
      backgroundColor: '#ccc',
      beaconSize: 50,
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      primaryColor: '#d54e21',
      spotlightShadow: '0 0 25px rgba(0, 0, 0, 0.75)',
      textColor: '#333',
      width: undefined,
      zIndex: 1050,
    },
  };

  // Joyride config properties.  Some can also be configured per-step.
  // See https://docs.react-joyride.com/step#common-props-inheritance for more info.
  const {
    continuous,
    disableOverlayClose,
    spotlightClicks,
    steps,
    hideCloseButton,
    eventTriggersIncrement,
  } = (currentStepObj || {}).joyride || {};

  const [elementPositionKey, setElementPositionKey] = useState(key);
  const [stepIndex, setStepIndex] = useState();
  const [run, setRun] = useState(false);

  const incrementKey = () => {
    key += 1;
    setElementPositionKey(key);
  };

  const currentJoyrideStep = steps && steps[stepIndex];

  if (currentJoyrideStep) {
    const { hideNextButton } = currentJoyrideStep;
    if (hideNextButton) styles.buttonNext = { display: 'none' };
    if (hideCloseButton) styles.buttonClose = { display: 'none' };
  }

  // Allow triggering step increment via event
  useEffect(() => {
    const incrementStep = () => {
      if (run && eventTriggersIncrement) setStepIndex(stepIndex + 1);
    };
    events.on('joyride:increment', incrementStep);
    return () => {
      events.off('joyride:increment', incrementStep);
    };
  });

  // For the tutorial tour, we need to reset the product picker to initial state
  useEffect(() => {
    if (eventTriggersIncrement) {
      resetProductPicker();
    }
  }, [currentTourStep]);

  /**
   * Set a placeholder DOM element's position based on map coords
   * @param {*} element
   * @param {*} targetCoordinates
   */
  function setPlaceholderLocation (element, targetCoordinates) {
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

  /**
   * Add placeholder DOM elements based on map coordinates so
   * Joyride can place a beacon on them
   */
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

  /**
   * When the map is moved, zoomed, or the browser is resized,
   * any placeholder DOM elements being used as Joyride targets
   * need to have their positiions updated.
   */
  function updateTargetsOnResize() {
    const { status, action } = joyrideProps || {};
    if (
      status === STATUS.FINISHED
      || action === ACTIONS.RESET
      || !(steps && steps.length)
    ) {
      return;
    }
    (steps || []).forEach((step) => {
      const { target, targetCoordinates } = step || {};
      if (target && targetCoordinates) {
        const placeholderEl = document.querySelector(target);
        setPlaceholderLocation(placeholderEl, targetCoordinates);
      }
    });
    // Force a re-render so that Joyride updates the beacon location,
    // otherwise it doesn't know the DOM element position was updated
    incrementKey();
  }

  function joyrideStateCallback(data) {
    joyrideProps = data;
    const {
      action, index, type, status,
    } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      const newIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(newIndex);
      if (newIndex >= 0 && newIndex < steps.length && steps[newIndex].targetCoordinates) {
        updateTargetsOnResize();
      }
    }
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setStepIndex(0);
      setRun(false);
    }
  }

  /**
   * Forcing a re-render on a target resize (by calling incrementKey())
   * was causing the beacon to be skipped due to this line in the
   * Joyride Step component: https://github.com/gilbarbara/react-joyride/blob/2a40561e698f71b3a5c10e018eb7b95f5a797555/src/components/Step.js#L109
   *
   * If any tour step has a Joyride step beyond the first which inicludes
   * targetCoordinates, it cannot be run as continuous.
   */
  function checkContinuous () {
    let isContinuous = continuous;
    (steps || []).forEach((step, index) => {
      if (index > 0 && step.targetCoordinates) isContinuous = false;
    });
    return isContinuous;
  }

  // Handle effects related to changing the tour step
  useEffect(() => {
    addPlaceholderElements();
    map.getView().changed();
    incrementKey();
    setRun(false);
    setStepIndex(undefined);
    setTimeout(() => {
      if (steps && steps.length) {
        setStepIndex(0);
        setRun(true);
      }
    });
  }, [currentTourStep]);

  // Force re-render on projection change to reset Joyride
  useEffect(incrementKey, [proj]);

  // Register/de-register evnt listeners for map changes
  useEffect(() => {
    map.getView().on('change', updateTargetsOnResize);
    return () => map.getView().un('change', updateTargetsOnResize);
  });

  // When tour is complete, remove all placeholder elements
  useEffect(() => {
    if (tourComplete) {
      placeholderElements.forEach((element) => element.remove());
    }
  });

  return !projMatches ? null : (
    <Joyride
      run={run}
      stepIndex={stepIndex}
      key={elementPositionKey}
      steps={steps || []}
      continuous={checkContinuous()}
      callback={joyrideStateCallback}
      spotlightClicks={spotlightClicks}
      disableOverlayClose={disableOverlayClose}
      hideCloseButton={hideCloseButton}
      styles={styles}
      disableScrolling
      disableScrollParentFix
    />
  );
}

JoyrideWrapper.propTypes = {
  currentTourStep: PropTypes.number,
  map: PropTypes.object,
  proj: PropTypes.string,
  tourComplete: PropTypes.bool,
  tourSteps: PropTypes.array,
  resetProductPicker: PropTypes.func,
};
