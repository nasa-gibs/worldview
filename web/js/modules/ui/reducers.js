import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  SET_ERROR_TILES,
  DISPLAY_STATIC_MAP,
  CLEAR_ERROR_TILES,
  READY_FOR_KIOSK_ANIMATION,
  CHECK_ANIMATION_AVAILABILITY,
} from './constants';

export const uiState = {
  isDistractionFreeModeActive: false,
  isKioskModeActive: false,
  displayStaticMap: false,
  eic: '', // 'sa' == subdaily-animation, 'da' == daily-animation
  errorTiles: {
    dailyTiles: [],
    subdailyTiles: [],
    blankTiles: [],
    kioskTileCount: 0,
    lastCheckedDate: null,
  },
  readyForKioskAnimation: false,
  animationAvailabilityChecked: false,
};

export default function uiReducers(state = uiState, action) {
  switch (action.type) {
    case TOGGLE_DISTRACTION_FREE_MODE:
      return {
        ...state,
        isDistractionFreeModeActive: !state.isDistractionFreeModeActive,
      };
    case TOGGLE_KIOSK_MODE:
      return {
        ...state,
        isKioskModeActive: action.isActive,
      };
    case SET_ERROR_TILES:
      return {
        ...state,
        errorTiles: {
          ...action.errorTiles,
        },
      };
    case CLEAR_ERROR_TILES:
      return {
        ...state,
        errorTiles: {
          ...action.errorTiles,
        },
      };
    case DISPLAY_STATIC_MAP:
      return {
        ...state,
        displayStaticMap: action.isActive,
      };
    case READY_FOR_KIOSK_ANIMATION:
      return {
        ...state,
        readyForKioskAnimation: action.toggleAnimation,
      };
    case CHECK_ANIMATION_AVAILABILITY:
      return {
        ...state,
        animationAvailabilityChecked: action.toggleCheck,
      };
    default:
      return state;
  }
}
