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

const { GEOSEARCH_COLLAPSED } = safeLocalStorage.keys;

/**
 * Animate coordinates marker
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 * @param {Number} zoom
 */
export function animateCoordinates(map, config, coordinates, zoom) {
  const { projections } = config;
  const { selected } = map.ui;
  const { proj } = selected;
  const { crs } = projections[proj];

  let [x, y] = coordinates;
  if (proj !== 'geographic') {
    [x, y] = coordinatesCRSTransform(coordinates, 'EPSG:4326', crs);
  }
  map.ui.animate.fly([x, y], zoom);
}

/**
 * Check if coordinates are within selected map extent
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 */
export function areCoordinatesWithinExtent(map, config, coordinates) {
  const { projections } = config;
  const { selected } = map.ui;
  const { proj } = selected;
  const { maxExtent, crs } = projections[proj];

  let [x, y] = coordinates;
  if (proj !== 'geographic') {
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
export function getCoordinatesMarker(map, config, coordinates, reverseGeocodeResults) {
  const { projections } = config;
  const { selected } = map.ui;
  const { proj } = selected;
  const { crs } = projections[proj];

  // only add marker within current map extent
  const coordinatesWithinExtent = areCoordinatesWithinExtent(map, config, coordinates);
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
export function mapLocationToGeosearchState(
  parameters,
  stateFromLocation,
  state,
) {
  const { gm } = parameters;
  const validCoordinates = gm
    ? gm.split(',')
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
    geosearch: {
      coordinates: { $set: coordinates },
      isExpanded: { $set: isExpanded },
      isCoordinatesDialogOpen: { $set: isValid },
    },
  });

  return stateFromLocation;
}

/**
 * @return {Boolean} is geosearch local storage set to 'collapsed'
 */
export function getLocalStorageCollapseState() {
  return safeLocalStorage.getItem(GEOSEARCH_COLLAPSED) === 'collapsed';
}

/**
 * @param {String} storageValue
 * @return {Void}
 */
export function setLocalStorageCollapseState(storageValue) {
  safeLocalStorage.setItem(GEOSEARCH_COLLAPSED, storageValue);
}

/**
 * @param {Object} config
 * @return {Boolean} is geosearch feature enabled
 */
export const isGeosearchFeatureEnabled = ({ features }) => !!(features.geocodeSearch && features.geocodeSearch.url);
