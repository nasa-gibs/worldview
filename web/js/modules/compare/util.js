import { initialCompareState } from './reducers';
import update from 'immutability-helper';

export function mapLocationToCompareState(parameters, stateFromLocation) {
  if (parameters.ca !== undefined) {
    stateFromLocation = update(stateFromLocation, {
      compare: { active: { $set: true } }
    });
    if (parameters.ca === 'false') {
      stateFromLocation = update(stateFromLocation, {
        compare: { activeString: { $set: 'activeB' } }
      });
      stateFromLocation = update(stateFromLocation, {
        layers: { hasSecondLayerGroup: { $set: true } }
      });
    }
  } else {
    stateFromLocation = update(stateFromLocation, {
      compare: { $set: initialCompareState }
    });
  }
  return stateFromLocation;
}
