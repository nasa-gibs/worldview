/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import {
  LineString as OlLineString,
  Polygon as OlGeomPolygon,
} from 'ol/geom';
import { transform } from 'ol/proj';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import {
  getGeographicLibDistance,
  getGeographicLibArea,
} from './util';
import { CRS } from '../../modules/map/constants';


const metersPerKilometer = 1000;
const ftPerMile = 5280;
const sqFtPerSqMile = 27878400;
const sqMeterPerKilometer = 1000000;
const metersToFeet = (meters) => meters * 3.28084;
const squareMetersToFeet = (sqMeters) => sqMeters * 10.76391;

export default function MeasureTooltip(props) {
  const {
    active,
    crs,
    unitOfMeasure,
    geometry,
    onRemove,
    proj,
  } = props;

  const activeStaticClass = active
    ? 'tooltip-active'
    : 'tooltip-static';

  /**
   * Convert and format raw measurements to two decimal points
   * @param {*} measurement
   * @param {*} factor
   * @return {String} - The measurement, converted based on factor and locale
   */
  const roundAndLocale = (measurement, factor = 1) => {
    const number = Math.round((measurement / factor) * 100) / 100;
    const format = (num, decimal) => Number(num.toFixed(decimal)).toLocaleString();
    if (number < 10) {
      return format(number, 2);
    }
    if (number >= 10 && number < 100) {
      return format(number, 1);
    }
    return format(number, 0);
  };

  /**
   * @return {String} - The formatted distance measurement
   */
  const getFormattedLength = () => {
    const transformedLine = geometry.clone().transform(crs, CRS.GEOGRAPHIC);
    const metricLength = getGeographicLibDistance(transformedLine);
    if (unitOfMeasure === 'km') {
      return metricLength > 100
        ? `${roundAndLocale(metricLength, metersPerKilometer)} km`
        : `${roundAndLocale(metricLength)} m`;
    }
    if (unitOfMeasure === 'mi') {
      const imperialLength = metersToFeet(metricLength);
      return imperialLength > (ftPerMile / 4)
        ? `${roundAndLocale(imperialLength, ftPerMile)} mi`
        : `${roundAndLocale(imperialLength)} ft`;
    }
  };

  /**
   * @return {String} - The formatted area measurement
   */
  const getFormattedArea = () => {
    const transformedPoly = geometry.clone().transform(crs, CRS.GEOGRAPHIC);
    const metricArea = getGeographicLibArea(transformedPoly);
    if (unitOfMeasure === 'km') {
      return metricArea > 10000
        ? `${roundAndLocale(metricArea, sqMeterPerKilometer)} km<sup>2</sup>`
        : `${roundAndLocale(metricArea)} m<sup>2</sup>`;
    }
    if (unitOfMeasure === 'mi') {
      const imperialArea = squareMetersToFeet(metricArea);
      return imperialArea > (sqFtPerSqMile / 8)
        ? `${roundAndLocale(imperialArea, sqFtPerSqMile)} mi<sup>2</sup>`
        : `${roundAndLocale(imperialArea)} ft<sup>2</sup>`;
    }
  };

  const getMeasurementValue = () => {
    if (!geometry) {
      return '0.0';
    }
    if (geometry instanceof OlGeomPolygon) {
      return getFormattedArea(geometry);
    }
    if (geometry instanceof OlLineString) {
      return getFormattedLength(geometry);
    }
  };

  const checkGeographicCoordValidity = (val) => val.indexOf('NaN') < 0;

  const checkPolarCoordValidity = () => {
    const coordinates = geometry.flatCoordinates;

    // Distance & Area measurement coordinates are stored differently, so identify based on geometry type
    const yCoord = geometry instanceof OlGeomPolygon ? coordinates[coordinates.length - 4] : coordinates[coordinates.length - 2];
    const xCoord = geometry instanceof OlGeomPolygon ? coordinates[coordinates.length - 3] : coordinates[coordinates.length - 1];
    const tCoord = transform([xCoord, yCoord], crs, CRS.GEOGRAPHIC);
    return areCoordinatesWithinExtent(proj, tCoord);
  };

  const tooltipValue = getMeasurementValue();
  const coordinatesAreValid = crs === CRS.GEOGRAPHIC ? checkGeographicCoordValidity(tooltipValue) : checkPolarCoordValidity();

  if (coordinatesAreValid) {
    return (
      <div className={`tooltip-measure tooltip-custom-black ${activeStaticClass}`}>
        <span dangerouslySetInnerHTML={{ __html: tooltipValue }} />
        {!active && (
          <span className="close-tooltip" onClick={onRemove} onTouchEnd={onRemove}>
            <FontAwesomeIcon icon="times" fixedWidth />
          </span>
        )}
      </div>
    );
  }
  return null;
}

MeasureTooltip.defaultProps = {
  active: true,
};
MeasureTooltip.propTypes = {
  active: PropTypes.bool,
  crs: PropTypes.string,
  geometry: PropTypes.object,
  onRemove: PropTypes.func,
  unitOfMeasure: PropTypes.string,
  proj: PropTypes.object,
};
