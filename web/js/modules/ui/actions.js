import googleTagManager from 'googleTagManager';

import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  CLEAR_ERROR_TILES,
  SET_ERROR_TILES,
  DISPLAY_STATIC_MAP,
  SET_ANIMATION_TILE_CHECK,
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

// this can probably be changed back to truthy/falsy but I would like to control isActive manually for now
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
    },
  };
}

export function clearErrorTiles() {
  return {
    type: CLEAR_ERROR_TILES,
  };
}

export function toggleStaticMap(isActive) {
  return {
    type: DISPLAY_STATIC_MAP,
    isActive,
  };
}

// check that each layer for the kiosk animation scenario has no tile errors
export function setAnimationTileCheck(tileCheck) {
  return {
    type: SET_ANIMATION_TILE_CHECK,
    tileCheck: {
      goesEast: tileCheck.goesEast,
      goesWest: tileCheck.goesWest,
      redVisible: tileCheck.redVisible,
    },
  };
}
