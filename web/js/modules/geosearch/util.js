import update from 'immutability-helper';

/**
 *
 * @param {*} parameters
 * @param {*} stateFromLocation
 */
export default function mapLocationToGeosearchState(
  parameters,
  stateFromLocation,
  state,
) {
  const { marker } = parameters;
  const coordinates = marker
    ? marker.split(',')
    : [];
  stateFromLocation = update(stateFromLocation, {
    geosearch: {
      coordinates: { $set: coordinates },
      isExpanded: { $set: !state.browser.lessThan.medium },
    },
  });

  return stateFromLocation;
}
