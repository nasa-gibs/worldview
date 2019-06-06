import update from 'immutability-helper';
import { assign as lodashAssign } from 'lodash';
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
  }
  return stateFromLocation;
}
