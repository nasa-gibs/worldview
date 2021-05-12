import update from 'immutability-helper';

/**
 * Update sidebar state when location-pop action occurs
 *
 * @param {Object} parameters | parameters parsed from permalink
 * @param {Object} stateFromLocation | State derived from permalink parsers
 * @param {Object} state | initial state before location POP action
 * @param {Object} config
 */
export default function mapLocationToSidebarState(
  parameters,
  stateFromLocation,
  state,
  config,
) {
  let activeTab;
  if (parameters.e) {
    activeTab = 'events';
  } else if (parameters.sh) {
    activeTab = 'download';
  } else {
    activeTab = 'layers';
  }
  stateFromLocation = update(stateFromLocation, {
    sidebar: {
      $set: {
        ...state.sidebar,
        activeTab,
      },
    },
  });
  return stateFromLocation;
}
