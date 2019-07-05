import update from 'immutability-helper';
import { assign as lodashAssign } from 'lodash';

/**
 * Update sidebar state when location-pop action occurs
 *
 * @param {Object} parameters | parameters parsed from permalink
 * @param {Object} stateFromLocation | State derived from permalink parsers
 * @param {Object} state | initial state before location POP action
 * @param {Object} config
 */
export function mapLocationToSidebarState(
  parameters,
  stateFromLocation,
  state,
  config
) {
  if (parameters.e) {
    let sidebarState = lodashAssign({}, state.sidebar, {
      activeTab: 'events'
    });
    stateFromLocation = update(stateFromLocation, {
      sidebar: { $set: sidebarState }
    });
  } else if (parameters.download) {
    let sidebarState = lodashAssign({}, state.sidebar, {
      activeTab: 'download'
    });
    stateFromLocation = update(stateFromLocation, {
      sidebar: { $set: sidebarState }
    });
  } else {
    let sidebarState = lodashAssign({}, state.sidebar, {
      activeTab: 'layers'
    });
    stateFromLocation = update(stateFromLocation, {
      sidebar: { $set: sidebarState }
    });
  }
  return stateFromLocation;
}
