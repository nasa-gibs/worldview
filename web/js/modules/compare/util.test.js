import { mapLocationToCompareState } from './util';
import { initialCompareState } from './reducers';

const stateFromLocation = { compare: initialCompareState };
const PERMALINK_STATE = { ca: '' };

test('mapLocationToCompareState sets compare as active is ca is defined permalink [compare-permalink]', () => {
  const response = mapLocationToCompareState(
    PERMALINK_STATE,
    stateFromLocation,
  );
  expect(stateFromLocation.compare.active).toBeFalsy();
  expect(response.compare.active).toBeTruthy();
});
