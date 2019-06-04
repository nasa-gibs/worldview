import { assign as lodashAssign } from 'lodash';
import util from '../../util/util';
import {
  OPEN_ANIMATION,
  EXIT_ANIMATION,
  PLAY_ANIMATION,
  STOP_ANIMATION,
  UPDATE_FRAME_RATE,
  TOGGLE_LOOPING,
  UPDATE_START_DATE,
  UPDATE_END_DATE,
  TOGGLE_GIF
} from './constants';

const defaultState = {
  isActive: false,
  isPlaying: false,
  loop: false,
  speed: 3,
  gifActive: false
};
export function getInitialState(config) {
  return lodashAssign({}, defaultState, {
    startDate: util.dateAdd(config.now, 'day', -7),
    endDate: config.now
  });
}

export function animationReducer(state = defaultState, action) {
  switch (action.type) {
    case OPEN_ANIMATION:
      return lodashAssign({}, state, {
        isActive: true,
        gifActive: false
      });
    case EXIT_ANIMATION:
      return lodashAssign({}, state, {
        isActive: false,
        gifActive: false
      });
    case PLAY_ANIMATION:
      return lodashAssign({}, state, {
        isPlaying: true,
        gifActive: false
      });
    case STOP_ANIMATION:
      return lodashAssign({}, state, {
        isPlaying: false
      });
    case UPDATE_FRAME_RATE:
      return lodashAssign({}, state, {
        speed: action.value
      });
    case UPDATE_START_DATE:
      return lodashAssign({}, state, {
        startDate: action.value
      });
    case UPDATE_END_DATE:
      return lodashAssign({}, state, {
        endDate: action.value
      });
    case TOGGLE_LOOPING:
      return lodashAssign({}, state, {
        loop: !state.loop
      });
    case TOGGLE_GIF:
      return lodashAssign({}, state, {
        gifActive: !state.gifActive
      });
    case 'KEY_PRESS_ACTION':
      if (action.keyCode === 32 && state.isActive) {
        return lodashAssign({}, state, {
          isPlaying: !state.isPlaying
        });
      } else {
        return state;
      }
    default:
      return state;
  }
}
