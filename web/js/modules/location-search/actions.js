import {
  CLEAR_MARKER,
  CLEAR_SUGGESTIONS,
  SET_MARKER,
  SET_SUGGESTION,
  TOGGLE_DIALOG_VISIBLE,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_LOCATION_SEARCH,
} from './constants';
import { requestAction } from '../core/actions';
import {
  areCoordinatesWithinExtent,
  setLocalStorageCollapseState,
} from './util';
import {
  LOCATION_SEARCH_REQUEST_OPTIONS,
} from './util-api';

const {
  REQUEST_OPTIONS,
  GEOCODE_SUGGEST_CATEGORIES,
  CONSTANT_REQUEST_PARAMETERS,
} = LOCATION_SEARCH_REQUEST_OPTIONS;

/**
 * Toggle show Location Search component
 */
export function toggleShowLocationSearch() {
  return (dispatch, getState) => {
    const state = getState();
    const { locationSearch } = state;
    const { isExpanded } = locationSearch;

    // handle localStorage user browser preference of expanded/collapsed
    const storageValue = isExpanded ? 'collapsed' : 'expanded';
    setLocalStorageCollapseState(storageValue);

    dispatch({
      type: TOGGLE_SHOW_LOCATION_SEARCH,
      value: !isExpanded,
    });
  };
}

/**
 * Toggle reverse geocode
 * @param {Boolean} isActive
 */
export function toggleReverseGeocodeActive(isActive) {
  return {
    type: TOGGLE_REVERSE_GEOCODE,
    value: isActive,
  };
}

/**
 * Set coordinates and reverse geocode results for place
 * @param {Array} coordinates
 * @param {Object} reverseGeocodeResults
 */
export function setPlaceMarker(coordinates, reverseGeocodeResults) {
  return (dispatch, getState) => {
    const state = getState();
    const {
      config, map,
    } = state;

    if (reverseGeocodeResults) {
      const { error } = reverseGeocodeResults;
      if (error) {
        console.warn(`REVERSE GEOCODING WARNING - ${error.message} ${error.details}`);
      }
    }

    const coordinatesWithinExtent = areCoordinatesWithinExtent(map, config, coordinates);
    if (!coordinatesWithinExtent) {
      return dispatch({
        type: SET_MARKER,
        coordinates: [],
        isCoordinatesDialogOpen: false,
      });
    }

    dispatch({
      type: SET_MARKER,
      reverseGeocodeResults,
      coordinates,
      isCoordinatesDialogOpen: true,
    });
  };
}

/**
 * Clear coordinates including marker and dialog (if open)
 */
export function clearCoordinates() {
  return (dispatch) => {
    dispatch({
      type: CLEAR_MARKER,
    });
  };
}

/**
 * Toggle show coordinates dialog
 * @param {Boolean} isVisible
 */
export function toggleDialogVisible(isVisible) {
  return (dispatch) => {
    dispatch({
      type: TOGGLE_DIALOG_VISIBLE,
      value: isVisible,
    });
  };
}

/**
 * Clear place suggestions
 */
export function clearSuggestions() {
  return (dispatch) => {
    dispatch({
      type: CLEAR_SUGGESTIONS,
      value: [],
    });
  };
}

/**
 * Set place suggestion
 * @param {Array} suggestion | suggestion object
 */
export function setSuggestion(suggestion) {
  return (dispatch) => {
    dispatch({
      type: SET_SUGGESTION,
      value: suggestion,
    });
  };
}

/**
 * Get place suggestions using ArcGIS suggest API
 * @param {String} val | input text to suggest places
 */
export function getSuggestions(val) {
  return (dispatch, getState) => {
    const { config } = getState();
    const { features: { locationSearch: { url: requestUrl } } } = config;

    const encodedValue = encodeURIComponent(val);
    const encodedCategories = encodeURIComponent(GEOCODE_SUGGEST_CATEGORIES.join(','));
    const request = `${requestUrl}suggest?${CONSTANT_REQUEST_PARAMETERS}&text=${encodedValue}&category=${encodedCategories}`;

    return requestAction(
      dispatch,
      'LOCATION_SEARCH/REQUEST_SUGGEST_PLACE',
      request,
      '',
      'location-search-suggest-place',
      REQUEST_OPTIONS,
    );
  };
}
