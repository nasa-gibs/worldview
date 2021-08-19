import update from 'immutability-helper';
import lodashIsNaN from 'lodash/isNaN';
import OlPoint from 'ol/geom/Point';
import OlFeature from 'ol/Feature';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import {
  Style as OlStyle,
  Icon as OlIcon,
} from 'ol/style';
import { containsXY } from 'ol/extent';
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
export function getCoordinatesMarker(proj, coordinates, reverseGeocodeResults) {
  const { crs } = proj.selected;

  // only add marker within current map extent
  const coordinatesWithinExtent = areCoordinatesWithinExtent(proj, coordinates);
  if (!coordinatesWithinExtent) {
    return false;
  }

  // transform coordinates if not CRS EPSG:4326
  let transformedCoordinates = false;
  if (proj !== 'geographic') {
    transformedCoordinates = coordinatesCRSTransform(coordinates, 'EPSG:4326', crs);
  }

  // create Ol vector layer map pin
  const marker = createPin(coordinates, transformedCoordinates, reverseGeocodeResults);
  return marker;
}

/**
 * Create Ol vector layer map pin
 * @param {Array} coordinates
 * @param {Array} transformedCoordinates
 * @param {Object} reverseGeocodeResults
 */
const createPin = function(coordinates, transformedCoordinates = false, reverseGeocodeResults = {}) {
  const [longitude, latitude] = coordinates;
  const iconFeature = new OlFeature({
    geometry: new OlPoint(transformedCoordinates || coordinates),
    reverseGeocodeResults,
    latitude,
    longitude,
  });

  const iconStyle = new OlStyle({
    image: new OlIcon({
      anchorOrigin: 'bottom-left',
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      scale: 0.5,
      src: 'images/map-pin.png',
    }),
  });

  iconFeature.setStyle(iconStyle);
  iconFeature.setId('coordinates-map-marker');

  const vectorSource = new OlSourceVector({
    wrapX: false,
    features: [iconFeature],
  });
  const vectorLayer = new OlLayerVector({
    source: vectorSource,
  });

  return vectorLayer;
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
  const validCoordinates = s
    ? s.split(',')
      .map((coord) => Number(coord))
      .filter((coord) => !lodashIsNaN(parseFloat(coord)))
    : [];
  const isValid = validCoordinates.length === 2;
  const coordinates = isValid
    ? validCoordinates
    : [];

  const isMobile = state.browser.lessThan.medium;
  const localStorageCollapseState = getLocalStorageCollapseState();
  const isExpanded = !isMobile && !localStorageCollapseState;

  stateFromLocation = update(stateFromLocation, {
    locationSearch: {
      coordinates: { $set: coordinates },
      isExpanded: { $set: isExpanded },
      isCoordinatesDialogOpen: { $set: isValid },
    },
  });

  return stateFromLocation;
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
