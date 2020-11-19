import {
  CLEAR_COORDINATES,
  CLEAR_SUGGESTIONS,
  REQUEST_SUGGEST_PLACE_FAILURE,
  REQUEST_SUGGEST_PLACE_SUCCESS,
  SELECT_COORDINATES_TO_FLY,
  SET_SUGGESTION,
  TOGGLE_REVERSE_GEOCODE_ACTIVE,
  TOGGLE_SHOW_GEOSEARCH,
  UPDATE_ACTIVE_MARKER,
} from './constants';
import { getLocalStorageCollapseState } from './util';

const localStorageCollapseState = getLocalStorageCollapseState();
export const geosearchState = {
  activeMarker: null,
  coordinates: [],
  isCoordinateSearchActive: false,
  isExpanded: !localStorageCollapseState,
  reverseGeocodeResults: null,
  suggestions: [],
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
    case CLEAR_SUGGESTIONS:
      return {
        ...state,
        suggestions: [],
      };
    case SET_SUGGESTION:
      return {
        ...state,
        suggestions: action.value,
      };
    case REQUEST_SUGGEST_PLACE_SUCCESS:
      return {
        ...state,
        suggestions: JSON.parse(action.response).suggestions,
      };
    case REQUEST_SUGGEST_PLACE_FAILURE:
      return {
        ...state,
        suggestions: [],
      };
    default:
      return state;
  }
}
