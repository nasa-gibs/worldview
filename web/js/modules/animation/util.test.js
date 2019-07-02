import { mapLocationToAnimationState } from './util';
import { defaultState } from './reducers';
const stateFromLocation = { animation: defaultState };
const PERMALINK_STATE = { ab: true, playanim: true };

test('mapLocationToAnimationState updates state to have isPlaying bool true if playanim and ab keys are present', () => {
  const response = mapLocationToAnimationState(
    PERMALINK_STATE,
    stateFromLocation
  );
  expect(stateFromLocation.animation.isPlaying).toBeFalsy();
  expect(response.animation.isPlaying).toBeTruthy();
});
