import React from 'react';
import ReactDOM from 'react-dom';
import update from 'immutability-helper';
import lodashIsNaN from 'lodash/isNaN';
import OlOverlay from 'ol/Overlay';
import { containsXY } from 'ol/extent';
import LocationMarker from '../../components/location-search/location-marker';
import { coordinatesCRSTransform } from '../projection/util';
import safeLocalStorage from '../../util/local-storage';
import { fly } from '../../map/util';

const { LOCATION_SEARCH_COLLAPSED } = safeLocalStorage.keys;

/**
 * Animate coordinates marker
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 * @param {Number} zoom
 */
export function animateCoordinates(map, proj, coordinates, zoom) {
  const { crs } = proj.selected;

  let [x, y] = coordinates;
  if (proj !== 'geographic') {
    [x, y] = coordinatesCRSTransform(coordinates, 'EPSG:4326', crs);
  }
  fly(map, proj, [x, y], zoom);
}

/**
 * Check if coordinates are within selected map extent
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 */
export function areCoordinatesWithinExtent(proj, coordinates) {
  const { maxExtent, crs } = proj.selected;
  let [x, y] = coordinates;
  if (crs !== 'EPSG:4326') {
    const transformedXY = coordinatesCRSTransform(coordinates, 'EPSG:4326', crs);
    [x, y] = transformedXY;
  }
  const coordinatesWithinExtent = containsXY(maxExtent, x, y);
  return coordinatesWithinExtent;
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
  const coordinates = [coordinatesObject.latitude, coordinatesObject.longitude];
  const { id } = coordinatesObject;

  // only add marker within current map extent
  const coordinatesWithinExtent = areCoordinatesWithinExtent(proj, coordinates);
  if (!coordinatesWithinExtent) {
    return false;
  }

  // transform coordinates if not CRS EPSG:4326
  let transformedCoords = coordinates;
  if (proj !== 'geographic') {
    transformedCoords = coordinatesCRSTransform(coordinates, 'EPSG:4326', crs);
  }

  const pinProps = {
    reverseGeocodeResults: results,
    coordinatesObject,
    removeMarker,
    isMobile,
    dialogVisible,
  };

  // create Ol vector layer map pin
  const marker = createPin(transformedCoords, pinProps, id);
  return marker;
}

/**
 * Create Ol vector layer map pin
 * @param {Array} coordinates
 * @param {Object} pinProps
 * @param {Number} id
 */
const createPin = function(coordinates, pinProps, id) {
  const overlayEl = document.createElement('div');
  ReactDOM.render(
    React.createElement(LocationMarker, pinProps),
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
    const [latitude, longitude] = coordinate
      ? coordinate.split(',')
        .map((coord) => Number(coord))
        .filter((coord) => !lodashIsNaN(parseFloat(coord)))
      : [];

    const validatedCoordinates = isValid && {
      id: Math.floor(Math.random() * (latitude + longitude)),
      latitude,
      longitude,
    };
    return validatedCoordinates;
  });

  const isMobile = state.browser.lessThan.medium;
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
  const serializeCoordinates = (coordinate) => {
    const coordinateValues = [coordinate.latitude, coordinate.longitude];
    if (map.ui.selected) {
      const coordinatesWithinExtent = areCoordinatesWithinExtent(proj, coordinateValues);
      if (!coordinatesWithinExtent) {
        return;
      }
    }
    return coordinateValues;
  };

  const serializeCoordinatesArray = (coordinatesArray) => coordinatesArray.map((coordinate) => serializeCoordinates(coordinate));
  const coordinatesURL = Array.isArray(coordinates) ? serializeCoordinatesArray(coordinates) : serializeCoordinates(coordinates);
  return coordinatesURL.join('+');
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
