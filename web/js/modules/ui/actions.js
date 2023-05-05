import googleTagManager from 'googleTagManager';

import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  CLEAR_ERROR_TILES,
  SET_ERROR_TILES,
  DISPLAY_STATIC_MAP,
  READY_FOR_KIOSK_ANIMATION,
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

export function toggleKioskMode(isActive) {
  return {
    type: TOGGLE_KIOSK_MODE,
    isActive,
  };
}

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

export function toggleStaticMap(isActive) {
  return {
    type: DISPLAY_STATIC_MAP,
    isActive,
  };
}

export function toggleReadyForKioskAnimation(toggleAnimation) {
  return {
    type: READY_FOR_KIOSK_ANIMATION,
    toggleAnimation,
  };
}
