import googleTagManager from 'googleTagManager';

import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  CLEAR_ERROR_TILES,
  SET_ERROR_TILES,
  DISPLAY_STATIC_MAP,
  READY_FOR_KIOSK_ANIMATION,
  CHECK_ANIMATION_AVAILABILITY,
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

// Layerbuilder tracks tile requests that return errors or blank tiles and dispatches this action for specific layers.
export function setErrorTiles(errorTiles) {
  return {
    type: SET_ERROR_TILES,
    errorTiles: {
      dailyTiles: errorTiles.dailyTiles,
      subdailyTiles: errorTiles.subdailyTiles,
      blankTiles: errorTiles.blankTiles,
      kioskTileCount: errorTiles.kioskTileCount,
      lastCheckedDate: errorTiles.lastCheckedDate,
    },
  };
}

// After each tile request we call this to clear the error tiles for the current date.
// We want to preserve the lastCheckedDate value from the previous dispatched setErrorTiles action.
export function clearErrorTiles() {
  return (dispatch, getState) => {
    const { ui: { errorTiles: { lastCheckedDate } } } = getState();
    const errorTiles = {
      dailyTiles: [],
      subdailyTiles: [],
      blankTiles: [],
      kioskTileCount: 0,
      lastCheckedDate,
    };

    dispatch({
      type: CLEAR_ERROR_TILES,
      errorTiles: {
        dailyTiles: errorTiles.dailyTiles,
        subdailyTiles: errorTiles.subdailyTiles,
        blankTiles: errorTiles.blankTiles,
        kioskTileCount: errorTiles.kioskTileCount,
        lastCheckedDate: errorTiles.lastCheckedDate,
      },
    });
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
