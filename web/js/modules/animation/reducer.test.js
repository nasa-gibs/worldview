import update from 'immutability-helper';
import { defaultState, animationReducer } from './reducers';
import * as CONSTANTS from './constants';
import util from '../../util/util';

const now = util.now();
const then = util.dateAdd(now, 'day', -7);

test('OPEN_ANIMATION action updates active state', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.OPEN_ANIMATION,
  });

  expect(response.isActive).toEqual(true);
});

test('EXIT_ANIMATION action toggles isPlaying and isActive values', () => {
  let updatedState = update(defaultState, { isActive: { $set: true } });
  updatedState = update(updatedState, { isPlaying: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.EXIT_ANIMATION,
  });
  expect(updatedState.isActive).toEqual(true);
  expect(updatedState.isPlaying).toEqual(true);
  expect(response.isActive).toEqual(false);
  expect(response.isPlaying).toEqual(false);
});
test('PLAY_ANIMATION action makes isPlaying truthy', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.PLAY_ANIMATION,
  });
  expect(defaultState.isPlaying).toEqual(false);
  expect(response.isPlaying).toEqual(true);
});
test('UPDATE_FRAME_RATE action changes speed value', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.UPDATE_FRAME_RATE,
    value: 5,
  });
  expect(defaultState.speed).toEqual(3);
  expect(response.speed).toEqual(5);
});
test('UPDATE_START_AND_END_DATE action updates dates', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.UPDATE_START_AND_END_DATE,
    startDate: then,
    endDate: now,
  });
  expect(defaultState.startDate).toBeUndefined();
  expect(defaultState.endDate).toBeUndefined();
  expect(response.startDate).toEqual(then);
  expect(response.endDate).toEqual(now);
});
test('UPDATE_START_DATE action changes startDate value', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.UPDATE_START_DATE,
    value: then,
  });
  expect(defaultState.startDate).toBeUndefined();
  expect(response.startDate).toEqual(then);
});
test('UPDATE_END_DATE action changes endDate value', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.UPDATE_END_DATE,
    value: now,
  });
  expect(defaultState.startDate).toBeUndefined();
  expect(response.endDate).toEqual(now);
});
test('TOGGLE_LOOPING action toggles loop value', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.TOGGLE_LOOPING,
  });
  expect(defaultState.loop).toBeFalsy();
  expect(response.loop).toBeTruthy();
});
test('TOGGLE_GIF action toggles gifActive bool value', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.TOGGLE_GIF,
  });
  expect(defaultState.gifActive).toBeFalsy();
  expect(response.gifActive).toBeTruthy();
});

test('KEY_PRESS_ACTION action toggles isPlaying bool when animation is active', () => {
  const updatedState = update(defaultState, { isActive: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.KEY_PRESS_ACTION,
    keyCode: 32,
  });
  expect(updatedState.isPlaying).toBeFalsy();
  expect(response.isPlaying).toBeTruthy();
});
test('KEY_PRESS_ACTION action does not toggle isPlaying bool when animation is inActive', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.KEY_PRESS_ACTION,
    keyCode: 32,
  });
  expect(defaultState.isPlaying).toBeFalsy();
  expect(response.isPlaying).toBeFalsy();
});
