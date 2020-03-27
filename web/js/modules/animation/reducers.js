import { assign as lodashAssign } from 'lodash';
import util from '../../util/util';
import {
  OPEN_ANIMATION,
  EXIT_ANIMATION,
  PLAY_ANIMATION,
  STOP_ANIMATION,
  UPDATE_FRAME_RATE,
  TOGGLE_LOOPING,
  UPDATE_START_AND_END_DATE,
  UPDATE_START_DATE,
  UPDATE_END_DATE,
  UPDATE_CROP_BOUNDS,
  TOGGLE_GIF,
  KEY_PRESS_ACTION,
} from './constants';

export const defaultState = {
  isActive: false,
  isPlaying: false,
  loop: false,
  speed: 3,
  gifActive: false,
  startDate: undefined,
  endDate: undefined,
  boundares: undefined,
};
export function getInitialState(config) {
  return lodashAssign({}, defaultState, {
    startDate: util.dateAdd(config.initialDate, 'day', -7),
    endDate: config.initialDate,
  });
}

export function animationReducer(state = defaultState, action) {
  switch (action.type) {
    case OPEN_ANIMATION:
      return lodashAssign({}, state, {
        isActive: true,
        gifActive: false,
      });
    case EXIT_ANIMATION:
      return lodashAssign({}, state, {
        isActive: false,
        gifActive: false,
        isPlaying: false,
      });
    case PLAY_ANIMATION:
      return lodashAssign({}, state, {
        isPlaying: true,
        gifActive: false,
      });
    case STOP_ANIMATION:
      return lodashAssign({}, state, {
        isPlaying: false,
      });
    case UPDATE_FRAME_RATE:
      return lodashAssign({}, state, {
        speed: action.value,
      });
    case UPDATE_START_AND_END_DATE:
      return lodashAssign({}, state, {
        startDate: action.startDate,
        endDate: action.endDate,
        isPlaying: false,
      });
    case UPDATE_START_DATE:
      return lodashAssign({}, state, {
        startDate: action.value,
        isPlaying: false,
      });
    case UPDATE_END_DATE:
      return lodashAssign({}, state, {
        endDate: action.value,
        isPlaying: false,
      });
    case UPDATE_CROP_BOUNDS:
      return lodashAssign({}, state, {
        boundaries: action.value,
      });
    case TOGGLE_LOOPING:
      return lodashAssign({}, state, {
        loop: !state.loop,
      });
    case TOGGLE_GIF:
      return lodashAssign({}, state, {
        gifActive: !state.gifActive,
        isPlaying: false,
      });
    case KEY_PRESS_ACTION:
      if (action.keyCode === 32 && state.isActive) {
        return lodashAssign({}, state, {
          isPlaying: !state.isPlaying,
        });
      }
      return state;

    default:
      return state;
  }
}
