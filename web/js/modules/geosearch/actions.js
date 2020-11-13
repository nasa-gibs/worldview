
import {
  CLEAR_COORDINATES,
  SELECT_COORDINATES_TO_FLY,
  TOGGLE_REVERSE_GEOCODE_ACTIVE,
  TOGGLE_SHOW_GEOSEARCH,
} from './constants';
import {
  addCoordinatesMarker,
  animateCoordinates,
  removeCoordinatesMarker,
} from './selectors';
import { getMaxZoomLevelLayerCollection } from '../layers/selectors';
import { setLocalStorageCollapseState } from './util';
import { getCoordinatesMetadata, renderCoordinatesTooltip } from '../../components/geosearch/ol-coordinates-marker-util';

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

export function toggleReverseGeocodeActive(isCoordinateSearchActive) {
  return {
    type: TOGGLE_REVERSE_GEOCODE_ACTIVE,
    value: isCoordinateSearchActive,
  };
}

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
    const zoom = map.ui.selected.getView().getZoom();
    const activeLayers = active.filter((layer) => layer.projections[proj.id] !== undefined);
    const maxZoom = getMaxZoomLevelLayerCollection(activeLayers, zoom, proj.id, sources);

    // handle render initial tooltip
    const [longitude, latitude] = coordinates;
    const geocodeProperties = { latitude, longitude, reverseGeocodeResults };
    const coordinatesMetadata = getCoordinatesMetadata(geocodeProperties);
    const clearMarkerAndCoordinates = () => {
      removeCoordinatesMarker(marker, map);
      dispatch({
        type: CLEAR_COORDINATES,
      });
    };

    // fly to coordinates and render coordinates tooltip
    animateCoordinates(map, config, coordinates, maxZoom);
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
