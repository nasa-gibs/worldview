import {
  CLEAR_SUGGESTIONS,
  REMOVE_MARKER,
  REQUEST_SUGGEST_PLACE_FAILURE,
  REQUEST_SUGGEST_PLACE_SUCCESS,
  SET_REVERSE_GEOCODE_RESULTS,
  SET_MARKER,
  SET_SUGGESTION,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_LOCATION_SEARCH,
} from './constants';
import { getLocalStorageCollapseState } from './util';

const localStorageCollapseState = getLocalStorageCollapseState();
export const locationSearchState = {
  coordinates: [],
  isCoordinateSearchActive: false,
  isExpanded: !localStorageCollapseState,
  reverseGeocodeResults: null,
  suggestions: [],
  suggestedPlace: [],
};

export function locationSearchReducer(state = locationSearchState, action) {
  switch (action.type) {
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
        coordinates: [...state.coordinates, action.coordinates],
        isCoordinateSearchActive: false,
        reverseGeocodeResults: action.reverseGeocodeResults,
      };
    case REMOVE_MARKER:
      return {
        ...state,
        coordinates: state.coordinates.filter((coordinate) => action.coordinates.id !== coordinate.id),
      };
    case SET_SUGGESTION:
      return {
        ...state,
        suggestedPlace: action.value,
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
