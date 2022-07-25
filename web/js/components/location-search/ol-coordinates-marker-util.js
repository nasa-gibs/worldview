/* eslint-disable import/prefer-default-export */
import { getFormattedCoordinates } from './util';
import util from '../../util/util';
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
 * @param {Object} geocodeProperties
 * @returns {Object} coordinatesMetadata
 */
export const getCoordinatesMetadata = (geocodeProperties) => {
  const { latitude, longitude, reverseGeocodeResults } = geocodeProperties;
  const normalizedLongitude = util.normalizeWrappedLongitude(longitude);
  const [formattedLatitude, formattedLongitude] = getFormattedCoordinates(latitude, normalizedLongitude);
  const title = getCoordinatesDialogTitle(
    reverseGeocodeResults,
    formattedLatitude,
    formattedLongitude,
  );
  const coordinates = `${formattedLatitude.trim()}, ${formattedLongitude.trim()}`;

  return {
    coordinates,
    title: title || coordinates,
  };
};
