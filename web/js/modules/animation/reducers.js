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
  UPDATE_END_DATE
} from './constants';

const defaultState = {
  isActive: false,
  isPlaying: false,
  loop: false,
  speed: 3,
  startDate: util.dateAdd(new Date(), 'day', -7),
  endDate: new Date()
};
// export function getInitialState(config) {
//   return lodashAssign({}, defaultState, {
//     startDate: util.dateAdd(new Date(), 'day', -7),
//     endDate: new Date()
//   });
// }
export function getInitialState(config) {
  return lodashAssign({}, defaultState);
}

export function animationReducer(state = defaultState, action) {
  switch (action.type) {
    case OPEN_ANIMATION:
      return lodashAssign({}, state, {
        isActive: true
      });
    case EXIT_ANIMATION:
      return lodashAssign({}, state, {
        isActive: false
      });
    case PLAY_ANIMATION:
      return lodashAssign({}, state, {
        isPlaying: true
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
    default:
      return state;
  }
}
