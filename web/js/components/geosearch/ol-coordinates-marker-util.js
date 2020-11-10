/* eslint-disable no-restricted-syntax */
/* eslint-disable no-nested-ternary */
import Overlay from 'ol/Overlay';
import React from 'react';
import ReactDOM from 'react-dom';
import CoordinatesDialog from './coordinates-dialog';
import { coordinatesCRSTransform } from '../../modules/projection/util';
import util from '../../util/util';

/**
 * Get parsed precision coordinate number
 * @param {String} coordinate
 * @returns {Number} parsed coordinate with modified precision
 */
function getCoordinateDisplayPrecision(coordinate) {
  const coordinateNumber = Number(coordinate);
  const coordinatePrecision = Math.abs(coordinateNumber) > 100
    ? 7
    : coordinateNumber < 0
      ? 7
      : 6;

  return parseFloat(coordinateNumber.toPrecision(coordinatePrecision));
}

/**
 * Create tooltip React DOM element
 *
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 * @param {Object} coordinatesMetadata
 * @param {Boolean} isMobile
 *
 * @returns {Void}
 */
export function renderTooltip(map, config, coordinates, coordinatesMetadata, isMobile) {
  const { projections } = config;
  const { proj } = map;
  const { crs } = projections[proj];
  const [latitude, longitude] = coordinates;

  // create tooltip overlay
  const tooltipElement = document.createElement('div');
  const tooltipId = `coordinates-map-marker-${latitude},${longitude}`;
  const tooltipOverlay = new Overlay({
    id: tooltipId,
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

  // helper function to remove tooltip overlay
  const removeTooltip = () => {
    map.removeOverlay(tooltipOverlay);
  };

  ReactDOM.render((
    <CoordinatesDialog
      coordinatesMetadata={coordinatesMetadata}
      toggleWithClose={removeTooltip}
      isMobile={isMobile}
    />
  ), tooltipOverlay.getElement());
}

/**
 * getCoordinatesMetadata for tooltip display
 *
 * @param {Object} geocodeProperties
 *
 * @returns {Object} coordinatesMetadata
 */
export function getCoordinatesMetadata(geocodeProperties) {
  const { latitude, longitude, reverseGeocodeResults } = geocodeProperties;
  const { address, error } = reverseGeocodeResults;

  const parsedLatitude = getCoordinateDisplayPrecision(latitude);
  const parsedLongitude = getCoordinateDisplayPrecision(longitude);

  // build title and metadata based on available parameters
  let title;
  if (error) {
    title = `${parsedLatitude}, ${parsedLongitude}`;
  } else if (address) {
    /* eslint-disable camelcase */
    const {
      Addr_type,
      Match_addr,
      ShortLabel,
      City,
      Region,
    } = address;
    if (Addr_type === 'PointAddress') {
      title = `${ShortLabel}, ${City}, ${Region}`;
    } else if (City && Region) {
      title = `${City}, ${Region}`;
    } else {
      title = `${Match_addr}`;
    }
  }

  // format coordinates based on localStorage preference
  const format = util.getCoordinateFormat();
  const coordinates = util.formatCoordinate(
    [parsedLongitude, parsedLatitude],
    format,
  );
  const formattedCoordinates = coordinates.split(',');
  const [formattedLatitude, formattedLongitude] = formattedCoordinates;

  return {
    latitude: formattedLatitude.trim(),
    longitude: formattedLongitude.trim(),
    title,
  };
}

/**
 * Get coordinate dialog feature at clicked map pixel
 *
 * @param {Array} pixels
 * @param {Object} map
 * @param {Object} config
 * @param {Boolean} isMobile
 *
 * @returns {Void}
 */
export function getCoordinatesDialogAtMapPixel(pixels, map, config, isMobile) {
  // check for existing coordinate marker tooltip overlay and prevent multiple renders
  const mapOverlays = map.getOverlays().getArray();
  const coordinatesTooltipOverlay = mapOverlays.filter((overlay) => {
    const { id } = overlay;
    return id && id.includes('coordinates-map-marker');
  });
  if (coordinatesTooltipOverlay.length > 0) {
    return;
  }

  map.forEachFeatureAtPixel(pixels, (feature) => {
    const featureId = feature.getId();
    if (featureId === 'coordinates-map-marker') {
      const featureProperties = feature.getProperties();
      const { latitude, longitude } = featureProperties;

      // get metadata for tooltip
      const coordinatesMetadata = getCoordinatesMetadata(featureProperties);

      // create tooltip overlay React DOM element
      renderTooltip(map, config, [latitude, longitude], coordinatesMetadata, isMobile);
    }
  });
}
