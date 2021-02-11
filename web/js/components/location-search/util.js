import CoordinateParser from 'coordinate-parser';
import util from '../../util/util';

/**
 * check for valid coordinates using https://www.npmjs.com/package/coordinate-parser
 * @param {String} position
 * @returns {Bool}
 */
export function isValidCoordinates(position) {
  try {
    const isValid = new CoordinateParser(position);
    return isValid;
  } catch (error) {
    return false;
  }
}

/**
 * Get fixed precision coordinate number
 * @param {String} coordinate
 * @returns {Number} parsed coordinate with fixed precision
 */
export const getCoordinateFixedPrecision = (coordinate) => Number(coordinate.toFixed(4));

/**
 * getFormattedCoordinates
 *
 * @param {String} latitude
 * @param {String} longitude
 *
 * @returns {Array} formattedCoordinates
 */
export const getFormattedCoordinates = (latitude, longitude) => {
  const parsedLatitude = getCoordinateFixedPrecision(latitude);
  const parsedLongitude = getCoordinateFixedPrecision(longitude);

  // format coordinates based on localStorage preference
  const format = util.getCoordinateFormat();
  const coordinates = util.formatCoordinate(
    [parsedLongitude, parsedLatitude],
    format,
  );
  const formattedCoordinates = coordinates.split(',');
  return formattedCoordinates;
};
