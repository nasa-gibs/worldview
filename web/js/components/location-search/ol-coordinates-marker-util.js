import Overlay from 'ol/Overlay';
import React from 'react';
import ReactDOM from 'react-dom';
import CoordinatesDialog from './coordinates-dialog';
import { coordinatesCRSTransform } from '../../modules/projection/util';
import util from '../../util/util';
import { getFormattedCoordinates } from './util';

/**
 * getCoordinatesDialogTitle
 *
 * @param {Object} geocodeProperties | address, error
 *
 * @returns {String | undefined} title
 */
const getCoordinatesDialogTitle = (geocodeProperties) => {
  const { address, error } = geocodeProperties;
  let title;
  if (address && !error) {
    /* eslint-disable camelcase */
    const {
      Match_addr,
      City,
      Region,
      Subregion,
    } = address;
    if (City && Region) {
      title = `${City}, ${Region}`;
    } else if (Subregion && Region) {
      title = `${Subregion}, ${Region}`;
    } else {
      title = `${Match_addr}`;
    }
  }
  return title;
};

/**
 * Create dialog React DOM element
 *
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 * @param {Object} coordinatesMetadata
 * @param {Boolean} isMobile
 * @param {Function} clearCoordinates
 * @param {Function} toggleDialogVisible
 *
 * @returns {Void}
 */
export const renderCoordinatesDialog = (map, config, coordinates, coordinatesMetadata, isMobile, clearCoordinates, toggleDialogVisible) => {
  const { projections } = config;
  const { proj } = map;
  const { crs } = projections[proj];
  const [latitude, longitude] = coordinates;

  // create tooltip overlay
  const tooltipElement = document.createElement('div');
  const tooltipId = util.encodeId(`coordinates-map-marker_${latitude},${longitude}`);
  const tooltipOverlay = new Overlay({
    id: tooltipId,
    className: 'coordinates-map-marker-dialog',
    element: tooltipElement,
    offset: [0, -40],
    positioning: 'bottom-center',
    stopEvent: false,
  });

  // transform polar projections coordinates
  let coordinatesPosition;
  if (proj === 'geographic') {
    coordinatesPosition = [longitude, latitude];
  } else {
    coordinatesPosition = coordinatesCRSTransform([longitude, latitude], 'EPSG:4326', crs);
  }

  // add tooltip overlay to map and position based on marker coordinates
  map.addOverlay(tooltipOverlay);
  tooltipOverlay.setPosition(coordinatesPosition);

  const coordinatesTooltipDOMEl = tooltipOverlay.getElement();

  // helper function to remove/hide tooltip overlay
  const removeCoordinatesDialog = () => {
    toggleDialogVisible(false);
    ReactDOM.unmountComponentAtNode(coordinatesTooltipDOMEl);
  };

  ReactDOM.render((
    <CoordinatesDialog
      coordinatesMetadata={coordinatesMetadata}
      removeCoordinatesDialog={removeCoordinatesDialog}
      clearCoordinates={clearCoordinates}
      isMobile={isMobile}
      tooltipId={tooltipId}
    />
  ), coordinatesTooltipDOMEl);

  return coordinatesTooltipDOMEl;
};

/**
 * getCoordinatesMetadata for tooltip display
 *
 * @param {Object} geocodeProperties
 *
 * @returns {Object} coordinatesMetadata
 */
export const getCoordinatesMetadata = (geocodeProperties) => {
  const { latitude, longitude, reverseGeocodeResults } = geocodeProperties;

  // get formatted coordinates
  const [formattedLatitude, formattedLongitude] = getFormattedCoordinates(latitude, longitude);

  // build title based on available parameters
  const title = getCoordinatesDialogTitle(reverseGeocodeResults, formattedLatitude, formattedLongitude);
  const coordinates = `${formattedLatitude.trim()}, ${formattedLongitude.trim()}`;

  return {
    coordinates,
    title: title || coordinates,
  };
};

/**
 * Get coordinate dialog feature at clicked map pixel
 *
 * @param {Array} pixels
 * @param {Object} map
 * @param {Boolean} isMobile
 *
 * @returns {Void}
 */
export const isCoordinatesDialogAvailableAtPixel = (pixels, map, isMobile) => {
  // check for existing coordinate marker tooltip overlay and prevent multiple renders
  const mapOverlays = map.getOverlays().getArray();
  const mapMarkerId = 'coordinates-map-marker';
  const coordinatesTooltipOverlay = mapOverlays.filter((overlay) => {
    const { id } = overlay;
    return id && id.includes(mapMarkerId);
  });
  if (coordinatesTooltipOverlay.length > 0) {
    return;
  }

  const featureOptions = isMobile ? { hitTolerance: 5 } : {};
  const featureCheck = (feature) => feature.getId() === mapMarkerId;
  return map.forEachFeatureAtPixel(pixels, featureCheck, featureOptions);
};
