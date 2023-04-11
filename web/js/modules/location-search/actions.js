import {
  CLEAR_SUGGESTIONS,
  REMOVE_MARKER,
  SET_MARKER,
  SET_SUGGESTION,
  SET_REVERSE_GEOCODE_RESULTS,
  TOGGLE_DIALOG_VISIBLE,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_LOCATION_SEARCH,
} from './constants';
import { requestAction } from '../core/actions';
import {
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
 * @param {Boolean} isInputSearch
 */
export function setPlaceMarker(coord, reverseGeocodeResults, isInputSearch) {
  return (dispatch, getState) => {
    const state = getState();
    const {
      locationSearch: { coordinates },
    } = state;
    const longitude = Number(coord[0].toFixed(4));
    const latitude = Number(coord[1].toFixed(4));

    if (reverseGeocodeResults) {
      const { error } = reverseGeocodeResults;
      if (error) {
        console.warn(`REVERSE GEOCODING WARNING - ${error.message} ${error.details}`);
      }
    }

    const markerAlreadyExists = coordinates.find(({ longitude: lon, latitude: lat }) => lon === longitude && lat === latitude);

    if (markerAlreadyExists) {
      return dispatch({
        type: SET_MARKER,
        coordinates: markerAlreadyExists,
        reverseGeocodeResults,
        isCoordinatesSearchActive: isInputSearch,
        flyToExistingMarker: true,
      });
    }

    const markerId = Math.floor(longitude * 1000 + latitude * 1000 + Math.random() * 1000);
    dispatch({
      type: SET_MARKER,
      coordinates: {
        id: markerId,
        longitude,
        latitude,
      },
      reverseGeocodeResults,
      isCoordinatesSearchActive: isInputSearch,
    });
  };
}

export function removeMarker(coordinates) {
  return {
    type: REMOVE_MARKER,
    coordinates,
  };
}

export function setGeocodeResults(results) {
  return {
    type: SET_REVERSE_GEOCODE_RESULTS,
    results,
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
