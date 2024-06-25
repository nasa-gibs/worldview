import googleTagManager from 'googleTagManager';

import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  DISPLAY_STATIC_MAP,
  READY_FOR_KIOSK_ANIMATION,
  CHECK_ANIMATION_AVAILABILITY,
  SET_EIC_MEASUREMENT_COMPLETE,
  SET_EIC_MEASUREMENT_ABORTED,
  SET_TRAVELING_HYPERWALL,
  SET_EIC_LEGACY,
} from './constants';
import { CLOSE as CLOSE_MODAL } from '../modal/constants';

export default function toggleDistractionFreeMode() {
  return (dispatch, getState) => {
    const { modal, ui } = getState();
    const { isDistractionFreeModeActive } = ui;
    const modalIsOpen = modal.isOpen;
    if (!isDistractionFreeModeActive) {
      googleTagManager.pushEvent({
        event: 'init_distraction_free_mode',
      });
    }
    dispatch({
      type: TOGGLE_DISTRACTION_FREE_MODE,
      isDistractionFreeModeActive: !isDistractionFreeModeActive,
    });
    if (!isDistractionFreeModeActive && modalIsOpen) {
      dispatch({ type: CLOSE_MODAL });
    }
  };
}

// Keeping this action for testing purposes.
// Kiosk mode should always be activated through the permalink parameters.
export function toggleKioskMode(isActive) {
  return {
    type: TOGGLE_KIOSK_MODE,
    isActive,
  };
}

// Dispatched when maximum date/time threshold is met when checking for error/blank tiles.
// Displays a static image map stored locally in repo.
export function toggleStaticMap(isActive) {
  return {
    type: DISPLAY_STATIC_MAP,
    isActive,
  };
}

// When kiosk mode is active && (eic === 'sa' || eic === 'da') this action is dispatched once we step the date back to full imagery.
// This signals that the animation availability to ready to be checked.
export function toggleReadyForKioskAnimation(toggleAnimation) {
  return {
    type: READY_FOR_KIOSK_ANIMATION,
    toggleAnimation,
  };
}

// When kiosk mode is active && (eic === 'sa' || eic === 'da') this action is dispatched once the animation has been triggered.
// Once availability is measured and passes the threshold metric this action will dispatch.
// This signals that the animation is ready to be played.
export function toggleCheckedAnimationAvailability(toggleCheck) {
  return {
    type: CHECK_ANIMATION_AVAILABILITY,
    toggleCheck,
  };
}

// This action is dispatched when tile image measurements are complete in TileMeasurement component
export function setEICMeasurementComplete() {
  return {
    type: SET_EIC_MEASUREMENT_COMPLETE,
  };
}

// This action is dispatched when the EIC measurement process is aborted in TileMeasurement component
export function setEICMeasurementAborted() {
  return {
    type: SET_EIC_MEASUREMENT_ABORTED,
  };
}

// This action is dispatched when the travel hyperwall exhibit param is active in the URL
export function setTravelMode(travelMode) {
  return {
    type: SET_TRAVELING_HYPERWALL,
    travelMode,
  };
}

// Determines whether EIC mode should query backend (new EIC) or query data from the frontend (legacy)
export function setEICLegacy(isLegacy) {
  return {
    type: SET_EIC_LEGACY,
    isLegacy,
  };
}
