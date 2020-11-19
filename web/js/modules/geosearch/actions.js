
import {
  CLEAR_COORDINATES,
  CLEAR_SUGGESTIONS,
  SELECT_COORDINATES_TO_FLY,
  SET_SUGGESTION,
  TOGGLE_REVERSE_GEOCODE_ACTIVE,
  TOGGLE_SHOW_GEOSEARCH,
} from './constants';
import {
  addCoordinatesMarker,
  animateCoordinates,
  removeCoordinatesMarker,
} from './selectors';
import { getMaxZoomLevelLayerCollection } from '../layers/selectors';
import {
  GEOSEARCH_REQUEST_OPTIONS,
  setLocalStorageCollapseState,
} from './util';
import { getCoordinatesMetadata, renderCoordinatesTooltip } from '../../components/geosearch/ol-coordinates-marker-util';
import { requestAction } from '../core/actions';

// toggle show geosearch component
export function toggleShowGeosearch() {
  return (dispatch, getState) => {
    const state = getState();
    const { geosearch } = state;
    const { isExpanded } = geosearch;

    // handle localStorage user browser preference of expanded/collapsed
    const storageValue = isExpanded ? 'collapsed' : 'expanded';
    setLocalStorageCollapseState(storageValue);

    dispatch({
      type: TOGGLE_SHOW_GEOSEARCH,
      value: !isExpanded,
    });
  };
}

// toggle reverse geocode - if active, next click on map will add marker and get coordinates
export function toggleReverseGeocodeActive(isCoordinateSearchActive) {
  return {
    type: TOGGLE_REVERSE_GEOCODE_ACTIVE,
    value: isCoordinateSearchActive,
  };
}

// use given coordinates to fly to that point, add marker, and display initial coordinates dialog
export function selectCoordinatesToFly(coordinates, reverseGeocodeResults) {
  return (dispatch, getState) => {
    const state = getState();
    const {
      browser, config, geosearch, map, layers, proj,
    } = state;
    const { sources } = config;
    const { active } = layers;
    const { activeMarker } = geosearch;
    const isMobile = browser.lessThan.medium;

    if (reverseGeocodeResults) {
      const { error } = reverseGeocodeResults;
      if (error) {
        console.log(`ERROR REVERSE GEOCODING - ${error.message} ${error.details}`);
      }
    }

    const marker = addCoordinatesMarker(activeMarker, config, map, coordinates, reverseGeocodeResults);
    if (!marker) {
      console.log('ERROR ADDING MARKER - Coordinates are outside range of current map projection extent.');
      return dispatch({
        type: SELECT_COORDINATES_TO_FLY,
        value: false,
        coordinates: [],
        activeMarker: null,
      });
    }

    // fly to coordinates and render coordinates tooltip
    const zoom = map.ui.selected.getView().getZoom();
    const activeLayers = active.filter((layer) => layer.projections[proj.id] !== undefined);
    const maxZoom = getMaxZoomLevelLayerCollection(activeLayers, zoom, proj.id, sources);
    animateCoordinates(map, config, coordinates, maxZoom);

    // handle render initial tooltip
    const [longitude, latitude] = coordinates;
    const geocodeProperties = {
      latitude,
      longitude,
      reverseGeocodeResults,
    };
    const coordinatesMetadata = getCoordinatesMetadata(geocodeProperties);
    const clearMarkerAndCoordinates = () => {
      removeCoordinatesMarker(marker, map);
      dispatch({
        type: CLEAR_COORDINATES,
      });
    };
    renderCoordinatesTooltip(map.ui.selected, config, [latitude, longitude], coordinatesMetadata, isMobile, clearMarkerAndCoordinates);

    dispatch({
      type: SELECT_COORDINATES_TO_FLY,
      value: false,
      reverseGeocodeResults,
      coordinates,
      activeMarker: marker,
    });
  };
}

// clear coordinates including marker and dialog (if open), adding new marker will clear any active marker
export function clearCoordinates() {
  return (dispatch, getState) => {
    const state = getState();
    const { map, geosearch } = state;
    const { activeMarker } = geosearch;

    if (activeMarker) {
      removeCoordinatesMarker(activeMarker, map);
    }
    dispatch({
      type: CLEAR_COORDINATES,
    });
  };
}

export function clearSuggestions() {
  return (dispatch) => {
    dispatch({
      type: CLEAR_SUGGESTIONS,
    });
  };
}

export function setSuggestion(suggestion) {
  return (dispatch) => {
    dispatch({
      type: SET_SUGGESTION,
      value: suggestion,
    });
  };
}

const {
  REQUEST_OPTIONS,
  GEOCODE_SUGGEST_CATEGORIES,
  CONSTANT_REQUEST_PARAMETERS,
} = GEOSEARCH_REQUEST_OPTIONS;

export function getSuggestions(val) {
  return (dispatch, getState) => {
    const { config } = getState();
    const { features: { geocodeSearch: { url: requestUrl } } } = config;

    const encodedValue = encodeURIComponent(val);
    const encodedCategories = encodeURIComponent(GEOCODE_SUGGEST_CATEGORIES.join(','));
    const request = `${requestUrl}suggest?text=${encodedValue}${CONSTANT_REQUEST_PARAMETERS}&category=${encodedCategories}`;

    return requestAction(
      dispatch,
      'GEOSEARCH/REQUEST_SUGGEST_PLACE',
      request,
      '',
      'geosearch-suggest-place',
      REQUEST_OPTIONS,
    );
  };
}
