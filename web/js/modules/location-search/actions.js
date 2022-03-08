import {
  CLEAR_MARKERS,
  CLEAR_SUGGESTIONS,
  UPDATE_MARKERS,
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
 * @param {Boolean} isInputSearch
 */
export function setPlaceMarker(coordinates, reverseGeocodeResults, isInputSearch) {
  return (dispatch, getState) => {
    const state = getState();
    const {
      proj,
    } = state;

    if (reverseGeocodeResults) {
      const { error } = reverseGeocodeResults;
      if (error) {
        console.warn(`REVERSE GEOCODING WARNING - ${error.message} ${error.details}`);
      }
    }

    const coordinatesWithinExtent = areCoordinatesWithinExtent(proj, coordinates);
    if (!coordinatesWithinExtent) {
      return dispatch({
        type: SET_MARKER,
        coordinates: [],
        isCoordinatesDialogOpen: false,
      });
    }

    const coordinatesObject = {
      id: Date.now(),
      latitude: coordinates[0],
      longitude: coordinates[1],
    };

    dispatch({
      type: SET_MARKER,
      reverseGeocodeResults,
      coordinatesObject,
      isCoordinatesDialogOpen: true,
      isInputSearch,
    });
  };
}

/**
 * Clear coordinates including marker and dialog (if open)
 */
export function clearCoordinates() {
  return (dispatch) => {
    dispatch({
      type: CLEAR_MARKERS,
    });
  };
}

/**
 * Remove marker and dialog (if open)
 * @param {Object} coordinatesObject
 */
export function removeMarker(coordinatesObject) {
  return (dispatch, getState) => {
    const state = getState();
    const {
      coordinates,
    } = state;
    dispatch({
      type: UPDATE_MARKERS,
      coordinates: [...coordinates].filter((coordinate) => coordinatesObject.id !== coordinate.id),
    });
  };
}

/**
 * Add OpenLayers ol_uid value to marker's coordinates object
 * @param {Object} coordinatesObject
 */
export function updateMarkerId(coordinatesObject) {
  return (dispatch, getState) => {
    const state = getState();
    const {
      coordinates,
    } = state;
    dispatch({
      type: UPDATE_MARKERS,
      coordinates: [...coordinates, coordinatesObject],
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
