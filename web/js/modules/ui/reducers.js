import { assign as lodashAssign } from 'lodash';
import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  SET_ERROR_TILES,
  DISPLAY_STATIC_MAP,
} from './constants';

export const uiState = {
  isDistractionFreeModeActive: false,
  isKioskModeActive: false,
  errorTiles: [],
  displayStaticMap: false,
};

export default function uiReducers(state = uiState, action) {
  switch (action.type) {
    case TOGGLE_DISTRACTION_FREE_MODE:
      return lodashAssign({}, state, {
        isDistractionFreeModeActive: !state.isDistractionFreeModeActive,
      });
    case TOGGLE_KIOSK_MODE:
      return lodashAssign({}, state, {
        isKioskModeActive: action.isActive,
      });
    case SET_ERROR_TILES:
      return {
        ...state,
        errorTiles: action.tiles,
      };
    case DISPLAY_STATIC_MAP:
      return {
        ...state,
        displayStaticMap: !state.displayStaticMap,
      };
    default:
      return state;
  }
}
