import React from 'react';
import ReactDOM from 'react-dom';
import update from 'immutability-helper';
import lodashIsNaN from 'lodash/isNaN';
import OlOverlay from 'ol/Overlay';
import { containsCoordinate } from 'ol/extent';
import { transform } from 'ol/proj';
import LocationMarker from '../../components/location-search/location-marker';
import safeLocalStorage from '../../util/local-storage';
import { fly } from '../../map/util';
import { FULL_MAP_EXTENT, CRS } from '../map/constants';

const { LOCATION_SEARCH_COLLAPSED } = safeLocalStorage.keys;

/**
 * Animate coordinates marker
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 * @param {Number} zoom
 */
export function animateCoordinates(map, proj, coordinates, zoom, isKioskModeActive) {
  const { crs } = proj.selected;

  let [x, y] = coordinates;
  if (proj !== 'geographic') {
    [x, y] = transform(coordinates, CRS.GEOGRAPHIC, crs);
  }
  fly(map, proj, [x, y], zoom, isKioskModeActive);
}

/**
 * Check if coordinates are within selected map extent
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 */
export function areCoordinatesWithinExtent(proj, coordinates) {
  const { maxExtent, crs } = proj.selected;
  const extent = crs === CRS.GEOGRAPHIC ? FULL_MAP_EXTENT : maxExtent;
  const coord = crs === CRS.GEOGRAPHIC ? coordinates : transform(coordinates, CRS.GEOGRAPHIC, crs);
  return containsCoordinate(extent, coord); // expects X then Y!
}

/**
 * Get coordinates marker
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 * @param {Object} reverseGeocodeResults
 */
export function getCoordinatesMarker(proj, coordinatesObject, results, removeMarker, isMobile, dialogVisible) {
  const { crs } = proj.selected;
  const { id, longitude, latitude } = coordinatesObject;
  const coordinates = [longitude, latitude];

  // transform coordinates if not CRS EPSG:4326
  let transformedCoords = coordinates;
  if (proj !== 'geographic') {
    transformedCoords = transform(coordinates, CRS.GEOGRAPHIC, crs);
  }

  const pinProps = {
    reverseGeocodeResults: results,
    coordinatesObject,
    isMobile,
    dialogVisible,
  };

  // create Ol vector layer map pin
  const marker = createPin(transformedCoords, pinProps, id, removeMarker);
  return marker;
}

/**
 * Create Ol vector layer map pin
 * @param {Array} coordinates
 * @param {Object} pinProps
 * @param {Number} id
 */
const createPin = function(coordinates, pinProps, id, removeMarkerPin) {
  const overlayEl = document.createElement('div');
  const removeMarker = () => {
    ReactDOM.unmountComponentAtNode(overlayEl);
    removeMarkerPin();
  };
  ReactDOM.render(
    React.createElement(LocationMarker, { ...pinProps, removeMarker }),
    overlayEl,
  );
  const markerPin = new OlOverlay({
    element: overlayEl,
    position: coordinates,
    positioning: 'bottom-center',
    stopEvent: false,
    id,
  });

  return markerPin;
};

/**
 *
 * @param {Object} parameters
 * @param {Object} stateFromLocation
 * @param {Object} state
 */
export function mapLocationToLocationSearchState(
  parameters,
  stateFromLocation,
  state,
) {
  const { s } = parameters;
  const coordinatesArray = s ? s.split('+') : [];
  const isValid = coordinatesArray.length >= 1;
  const validatedCoordinatesArray = coordinatesArray.map((coordinate) => {
    const [longitude, latitude] = coordinate
      ? coordinate.split(',')
        .map((coord) => Number(coord))
        .filter((coord) => !lodashIsNaN(parseFloat(coord)))
      : [];

    const markerId = Math.floor(longitude * 1000 + latitude * 1000 + Math.random() * 1000);
    const validatedCoordinates = isValid && {
      id: markerId,
      latitude,
      longitude,
    };
    return validatedCoordinates;
  });

  const isMobile = state.screenSize.isMobileDevice;
  const localStorageCollapseState = getLocalStorageCollapseState();
  const isExpanded = !isMobile && !localStorageCollapseState;

  stateFromLocation = update(stateFromLocation, {
    locationSearch: {
      coordinates: { $set: validatedCoordinatesArray },
      isExpanded: { $set: isExpanded },
    },
  });
  return stateFromLocation;
}

export function serializeCoordinatesWrapper(coordinates, state) {
  const { map, proj } = state;
  const serializeCoordinates = ({ longitude, latitude }) => {
    const coordinateValues = [longitude, latitude];
    if (!map.ui.selected) return;
    const coordinatesWithinExtent = areCoordinatesWithinExtent(proj, coordinateValues);
    if (!coordinatesWithinExtent) return;
    return coordinateValues;
  };

  const serializeCoordinatesArray = (coordinatesArray) => coordinatesArray
    .map((coordinate) => serializeCoordinates(coordinate))
    .filter((coordinate) => coordinate);
  const coordinatesURL = Array.isArray(coordinates) ? serializeCoordinatesArray(coordinates) : serializeCoordinates(coordinates);
  if (coordinatesURL.length > 0) {
    return coordinatesURL.join('+');
  }
}

/**
 * @return {Boolean} is Location Search local storage set to 'collapsed'
 */
export function getLocalStorageCollapseState() {
  return safeLocalStorage.getItem(LOCATION_SEARCH_COLLAPSED) === 'collapsed';
}

/**
 * @param {String} storageValue
 * @return {Void}
 */
export function setLocalStorageCollapseState(storageValue) {
  safeLocalStorage.setItem(LOCATION_SEARCH_COLLAPSED, storageValue);
}

/**
 * @param {Object} config
 * @return {Boolean} is Location Search feature enabled
 */
export const isLocationSearchFeatureEnabled = ({ features }) => !!(features.locationSearch && features.locationSearch.url);
