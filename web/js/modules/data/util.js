import update from 'immutability-helper';
/**
 * Update sidebar state when location-pop action occurs
 *
 * @param {Object} parameters | parameters parsed from permalink
 * @param {Object} stateFromLocation | State derived from permalink parsers
 * @param {Object} state | initial state before location POP action
 * @param {Object} config
 */
export function mapLocationToDataState(parameters, stateFromLocation) {
  if (parameters.download) {
    stateFromLocation = update(stateFromLocation, {
      data: { active: { $set: true } }
    });
  } else {
    stateFromLocation = update(stateFromLocation, {
      data: { active: { $set: false } }
    });
  }
  return stateFromLocation;
}
