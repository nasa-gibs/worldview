import update from 'immutability-helper';
import { defaultState, animationReducer, getInitialState } from './reducers';
import * as CONSTANTS from './constants';
import util from '../../util/util';

const now = util.now();
const then = util.dateAdd(now, 'day', -7);

test('OPEN_ANIMATION action updates active state [animation-reducer-open]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.OPEN_ANIMATION,
  });

  expect(response.isActive).toEqual(true);
});

test('EXIT_ANIMATION action toggles isPlaying and isActive values [animation-reducer-exit]', () => {
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

test('PLAY_ANIMATION action makes isPlaying truthy [animation-reducer-play]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.PLAY_ANIMATION,
  });
  expect(defaultState.isPlaying).toEqual(false);
  expect(response.isPlaying).toEqual(true);
});

test('UPDATE_FRAME_RATE action changes speed value [animation-reducer-speed]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.UPDATE_FRAME_RATE,
    value: 5,
  });
  expect(defaultState.speed).toEqual(3);
  expect(response.speed).toEqual(5);
});

test('UPDATE_START_AND_END_DATE action updates dates [animation-reducer-start-and-end-date]', () => {
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

test('UPDATE_START_DATE action changes startDate value [animation-reducer-start-date]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.UPDATE_START_DATE,
    value: then,
  });
  expect(defaultState.startDate).toBeUndefined();
  expect(response.startDate).toEqual(then);
});

test('UPDATE_END_DATE action changes endDate value [animation-reducer-end-date]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.UPDATE_END_DATE,
    value: now,
  });
  expect(defaultState.startDate).toBeUndefined();
  expect(response.endDate).toEqual(now);
});

test('TOGGLE_LOOPING action toggles loop value [animation-reducer-loop]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.TOGGLE_LOOPING,
  });
  expect(defaultState.loop).toBeFalsy();
  expect(response.loop).toBeTruthy();
});

test('TOGGLE_GIF action toggles gifActive bool value [animation-reducer-gif]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.TOGGLE_GIF,
  });
  expect(defaultState.gifActive).toBeFalsy();
  expect(response.gifActive).toBeTruthy();
});

test('KEY_PRESS_ACTION action toggles isPlaying bool when animation is active [animation-reducer-key-press-active]', () => {
  const updatedState = update(defaultState, { isActive: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.KEY_PRESS_ACTION,
    keyCode: 32,
  });
  expect(updatedState.isPlaying).toBeFalsy();
  expect(response.isPlaying).toBeTruthy();
});

test('KEY_PRESS_ACTION action does not toggle isPlaying bool when animation is inActive [animation-reducer-key-press-disabled]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.KEY_PRESS_ACTION,
    keyCode: 32,
  });
  expect(defaultState.isPlaying).toBeFalsy();
  expect(response.isPlaying).toBeFalsy();
});

test('STOP_ANIMATION action sets isPlaying to false [animation-reducer-stop]', () => {
  const updatedState = update(defaultState, { isPlaying: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.STOP_ANIMATION,
  });
  expect(updatedState.isPlaying).toEqual(true);
  expect(response.isPlaying).toEqual(false);
});

test('UPDATE_CROP_BOUNDS action sets boundaries value [animation-reducer-crop-bounds]', () => {
  const bounds = { x: 0, y: 0, width: 100, height: 100 };
  const response = animationReducer(defaultState, {
    type: CONSTANTS.UPDATE_CROP_BOUNDS,
    value: bounds,
  });
  expect(defaultState.boundaries).toBeUndefined();
  expect(response.boundaries).toEqual(bounds);
});

test('COLLAPSE_ANIMATION action toggles isCollapsed value [animation-reducer-collapse]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.COLLAPSE_ANIMATION,
  });
  expect(defaultState.isCollapsed).toBeFalsy();
  expect(response.isCollapsed).toBeTruthy();
});

test('TOGGLE_AUTOPLAY action toggles autoplay value [animation-reducer-autoplay]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.TOGGLE_AUTOPLAY,
  });
  expect(defaultState.autoplay).toBeFalsy();
  expect(response.autoplay).toBeTruthy();
});

test('KEY_PRESS_ACTION with keyCode 27 exits animation [animation-reducer-key-press-escape]', () => {
  const updatedState = update(defaultState, {
    isActive: { $set: true },
    isPlaying: { $set: true },
    gifActive: { $set: true },
  });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.KEY_PRESS_ACTION,
    keyCode: 27,
  });
  expect(response.isActive).toEqual(false);
  expect(response.isPlaying).toEqual(false);
  expect(response.gifActive).toEqual(false);
});

test('KEY_PRESS_ACTION with unrelated keyCode returns unchanged state [animation-reducer-key-press-other]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.KEY_PRESS_ACTION,
    keyCode: 65,
  });
  expect(response).toEqual(defaultState);
});

test('PLAY_KIOSK_ANIMATIONS action sets loop, speed, dates, and isPlaying [animation-reducer-kiosk]', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.PLAY_KIOSK_ANIMATIONS,
    startDate: then,
    endDate: now,
  });
  expect(response.loop).toEqual(true);
  expect(response.speed).toEqual(6);
  expect(response.startDate).toEqual(then);
  expect(response.endDate).toEqual(now);
  expect(response.isPlaying).toEqual(true);
});

test('OPEN_ANIMATION action sets gifActive to false [animation-reducer-open-gif-false]', () => {
  const updatedState = update(defaultState, { gifActive: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.OPEN_ANIMATION,
  });
  expect(response.gifActive).toEqual(false);
});

test('PLAY_ANIMATION action sets gifActive to false [animation-reducer-play-gif-false]', () => {
  const updatedState = update(defaultState, { gifActive: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.PLAY_ANIMATION,
  });
  expect(response.gifActive).toEqual(false);
});

test('UPDATE_START_AND_END_DATE action sets isPlaying to false [animation-reducer-start-end-date-stops-play]', () => {
  const updatedState = update(defaultState, { isPlaying: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.UPDATE_START_AND_END_DATE,
    startDate: then,
    endDate: now,
  });
  expect(response.isPlaying).toEqual(false);
});

test('UPDATE_START_DATE action sets isPlaying to false [animation-reducer-start-date-stops-play]', () => {
  const updatedState = update(defaultState, { isPlaying: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.UPDATE_START_DATE,
    value: then,
  });
  expect(response.isPlaying).toEqual(false);
});

test('UPDATE_END_DATE action sets isPlaying to false [animation-reducer-end-date-stops-play]', () => {
  const updatedState = update(defaultState, { isPlaying: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.UPDATE_END_DATE,
    value: now,
  });
  expect(response.isPlaying).toEqual(false);
});

test('TOGGLE_GIF action sets isPlaying to false [animation-reducer-gif-stops-play]', () => {
  const updatedState = update(defaultState, { isPlaying: { $set: true } });
  const response = animationReducer(updatedState, {
    type: CONSTANTS.TOGGLE_GIF,
  });
  expect(response.isPlaying).toEqual(false);
});

test('default action returns unchanged state [animation-reducer-default]', () => {
  const response = animationReducer(defaultState, { type: 'UNKNOWN_ACTION' });
  expect(response).toEqual(defaultState);
});

test('getInitialState returns startDate 7 days before initialDate and endDate as initialDate [animation-reducer-get-initial-state]', () => {
  const config = { initialDate: now };
  const state = getInitialState(config);
  expect(state.endDate).toEqual(now);
  expect(state.startDate).toEqual(util.dateAdd(now, 'day', -7));
});
