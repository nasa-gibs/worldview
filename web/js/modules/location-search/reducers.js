import {
  CLEAR_MARKER,
  CLEAR_SUGGESTIONS,
  REQUEST_SUGGEST_PLACE_FAILURE,
  REQUEST_SUGGEST_PLACE_SUCCESS,
  SET_REVERSE_GEOCODE_RESULTS,
  SET_MARKER,
  SET_SUGGESTION,
  SET_COORDINATES,
  TOGGLE_DIALOG_VISIBLE,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_LOCATION_SEARCH,
} from './constants';
import { getLocalStorageCollapseState } from './util';

const localStorageCollapseState = getLocalStorageCollapseState();
export const locationSearchState = {
  coordinates: [],
  isMarkerPlaced: false,
  isCoordinateSearchActive: false,
  isCoordinatesDialogOpen: false,
  isExpanded: !localStorageCollapseState,
  reverseGeocodeResults: null,
  suggestions: [],
  suggestedPlace: [],
};

export function locationSearchReducer(state = locationSearchState, action) {
  switch (action.type) {
    case TOGGLE_DIALOG_VISIBLE:
      return {
        ...state,
        isCoordinatesDialogOpen: action.value,
      };
    case TOGGLE_SHOW_LOCATION_SEARCH:
      return {
        ...state,
        isExpanded: action.value,
      };
    case TOGGLE_REVERSE_GEOCODE:
      return {
        ...state,
        isCoordinateSearchActive: action.value,
      };
    case SET_REVERSE_GEOCODE_RESULTS:
      return {
        ...state,
        reverseGeocodeResults: action.value,
      };
    case SET_MARKER:
      return {
        ...state,
        coordinates: action.coordinates,
        isMarkerPlaced: true,
        isCoordinateSearchActive: false,
        reverseGeocodeResults: action.reverseGeocodeResults,
        isCoordinatesDialogOpen: action.isCoordinatesDialogOpen,
      };
    case CLEAR_MARKER:
      return {
        ...state,
        coordinates: [],
        isMarkerPlaced: false,
        reverseGeocodeResults: null,
        isCoordinatesDialogOpen: false,
      };
    case SET_SUGGESTION:
      return {
        ...state,
        suggestedPlace: action.value,
      };
    case SET_COORDINATES:
      return {
        ...state,
        coordinates: action.coordinates,
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
    case CLEAR_SUGGESTIONS:
      return {
        ...state,
        suggestions: action.value,
        suggestedPlace: action.value,
      };
    default:
      return state;
  }
}
