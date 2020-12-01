import {
  CLEAR_MARKER,
  CLEAR_SUGGESTIONS,
  REQUEST_SUGGEST_PLACE_FAILURE,
  REQUEST_SUGGEST_PLACE_SUCCESS,
  SET_REVERSE_GEOCODE_RESULTS,
  SET_MARKER,
  SET_SUGGESTION,
  TOGGLE_DIALOG_VISIBLE,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_GEOSEARCH,
} from './constants';
import { getLocalStorageCollapseState } from './util';

const localStorageCollapseState = getLocalStorageCollapseState();
export const geosearchState = {
  coordinates: [],
  isCoordinateSearchActive: false,
  isCoordinatesDialogOpen: false,
  isExpanded: !localStorageCollapseState,
  reverseGeocodeResults: null,
  suggestions: [],
};

export function geosearchReducer(state = geosearchState, action) {
  switch (action.type) {
    case TOGGLE_DIALOG_VISIBLE:
      return {
        ...state,
        isCoordinatesDialogOpen: action.value,
      };
    case TOGGLE_SHOW_GEOSEARCH:
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
        isCoordinateSearchActive: false,
        reverseGeocodeResults: action.reverseGeocodeResults,
        isCoordinatesDialogOpen: action.isCoordinatesDialogOpen,
      };
    case CLEAR_MARKER:
      return {
        ...state,
        coordinates: [],
        reverseGeocodeResults: null,
        isCoordinatesDialogOpen: false,
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
    case CLEAR_SUGGESTIONS:
      return {
        ...state,
        suggestions: action.value,
      };
    default:
      return state;
  }
}
