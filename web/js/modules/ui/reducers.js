import {
  TOGGLE_DISTRACTION_FREE_MODE,
  TOGGLE_KIOSK_MODE,
  SET_ERROR_TILES,
  DISPLAY_STATIC_MAP,
  CLEAR_ERROR_TILES,
  READY_FOR_KIOSK_ANIMATION,
  CHECK_ANIMATION_AVAILABILITY,
  SET_EIC_MEASUREMENT_COMPLETE,
  SET_EIC_MEASUREMENT_ABORTED,
  SET_TRAVELING_HYPERWALL,
  SET_EIC_LEGACY,
} from './constants';

export const uiState = {
  isDistractionFreeModeActive: false,
  isKioskModeActive: false,
  displayStaticMap: false,
  eic: '', // 'sa' == subdaily-animation, 'da' == daily-animation 'si' == static-imagery
  readyForKioskAnimation: false,
  animationAvailabilityChecked: false,
  eicMeasurementComplete: false,
  eicMeasurementAborted: false,
  travelMode: '', // an id key that corresponds to a specific set of EIC scenario details for travel mode
  eicLegacy: false,
  scenario: '', // the scenario id that corresponds to the current EIC scenario to query backend
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
    case SET_EIC_MEASUREMENT_COMPLETE:
      return {
        ...state,
        eicMeasurementComplete: true,
      };
    case SET_EIC_MEASUREMENT_ABORTED:
      return {
        ...state,
        eicMeasurementAborted: true,
      };
    case SET_TRAVELING_HYPERWALL:
      return {
        ...state,
        travelMode: action.travelMode,
      };
    case SET_EIC_LEGACY:
      return {
        ...state,
        eicLegacy: action.isLegacy,
      };
    default:
      return state;
  }
}
