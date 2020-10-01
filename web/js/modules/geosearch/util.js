import update from 'immutability-helper';

/**
 *
 * @param {*} parameters
 * @param {*} stateFromLocation
 */
export default function mapLocationToGeosearchState(
  parameters,
  stateFromLocation,
) {
  if (parameters.marker) {
    stateFromLocation = update(stateFromLocation, {
      geosearch: {
        coordinates: { $set: parameters.marker.split(',') },
      },
    });
  }

  return stateFromLocation;
}
