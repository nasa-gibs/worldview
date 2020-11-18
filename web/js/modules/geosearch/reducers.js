import {
  CLEAR_COORDINATES,
  SELECT_COORDINATES_TO_FLY,
  TOGGLE_REVERSE_GEOCODE_ACTIVE,
  TOGGLE_SHOW_GEOSEARCH,
  UPDATE_ACTIVE_MARKER,
} from './constants';
import { getLocalStorageCollapseState } from './util';

const localStorageCollapseState = getLocalStorageCollapseState();
export const geosearchState = {
  isCoordinateSearchActive: false,
  isExpanded: !localStorageCollapseState,
  coordinates: [],
  activeMarker: null,
  reverseGeocodeResults: null,
};

export function geosearchReducer(state = geosearchState, action) {
  switch (action.type) {
    case UPDATE_ACTIVE_MARKER:
      return {
        ...state,
        activeMarker: action.value,
        reverseGeocodeResults: action.reverseGeocodeResults,
      };
    case TOGGLE_SHOW_GEOSEARCH:
      return {
        ...state,
        isExpanded: action.value,
      };
    case SELECT_COORDINATES_TO_FLY:
      return {
        ...state,
        isCoordinateSearchActive: action.value,
        coordinates: action.coordinates,
        activeMarker: action.activeMarker,
        reverseGeocodeResults: action.reverseGeocodeResults,
      };
    case CLEAR_COORDINATES:
      return {
        ...state,
        coordinates: [],
        activeMarker: null,
        reverseGeocodeResults: null,
      };
    case TOGGLE_REVERSE_GEOCODE_ACTIVE:
      return {
        ...state,
        isCoordinateSearchActive: action.value,
      };
    default:
      return state;
  }
}
