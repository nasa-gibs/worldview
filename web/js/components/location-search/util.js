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
 * * Normalize coordinates to be within the [-180, 180] range
 * @param {*} coordindates
 * @returns
 */
export function getNormalizedCoordinate([lon, lat]) {
  if (Math.abs(lon) < 180) {
    return [lon, lat];
  }
  const isNegative = lon < 0;
  const remainder = lon % 360;
  const longitude = isNegative && remainder < -180 ? remainder + 360 : !isNegative && remainder > 180 ? remainder - 360 : remainder;
  return [longitude, lat];
}

/**
 * Trucate to 4 decimal places, normalize, and format based on user preference
 *
 * @param {Array} coordinates
 * @returns {Array}
 */
export const getFormattedCoordinates = ([latitude, longitude]) => {
  const [lon, lat] = getNormalizedCoordinate([longitude, latitude]);
  const fixedLat = Number(Number(lat).toFixed(4));
  const fixedLon = Number(Number(lon).toFixed(4));
  const format = util.getCoordinateFormat();
  return util.formatCoordinate([fixedLon, fixedLat], format);
};
