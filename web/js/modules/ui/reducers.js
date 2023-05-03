import { assign as lodashAssign } from 'lodash';
import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  SET_ERROR_TILES,
  DISPLAY_STATIC_MAP,
  CLEAR_ERROR_TILES,
} from './constants';

export const uiState = {
  isDistractionFreeModeActive: false,
  isKioskModeActive: false,
  displayStaticMap: false,
  errorTiles: {
    dailyTiles: [],
    subdailyTiles: [],
    blankTiles: [],
    kioskTileCount: 0,
  },
  animationTileCheck: {
    goesEast: false,
    goesWest: false,
    redVisible: false,
  },
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
        errorTiles: {
          dailyTiles: action.errorTiles.dailyTiles,
          subdailyTiles: action.errorTiles.subdailyTiles,
          blankTiles: action.errorTiles.blankTiles,
          kioskTileCount: action.errorTiles.kioskTileCount,
        },
      };
    case CLEAR_ERROR_TILES:
      return {
        ...state,
        errorTiles: {
          dailyTiles: [],
          subdailyTiles: [],
          blankTiles: [],
          kioskTileCount: 0,
        },
      };
    case DISPLAY_STATIC_MAP:
      return lodashAssign({}, state, {
        displayStaticMap: action.isActive,
      });
    default:
      return state;
  }
}
