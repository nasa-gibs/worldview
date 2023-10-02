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
  COLLAPSE_ANIMATION,
  TOGGLE_AUTOPLAY,
  PLAY_KIOSK_ANIMATIONS,
} from './constants';

export const defaultState = {
  isActive: false,
  isPlaying: false,
  loop: false,
  speed: 3,
  gifActive: false,
  startDate: undefined,
  endDate: undefined,
  boundaries: undefined,
  isCollapsed: false,
  autoplay: false,
};
export function getInitialState(config) {
  return {
    ...defaultState,
    startDate: util.dateAdd(config.initialDate, 'day', -7),
    endDate: config.initialDate,
  };
}

export function animationReducer(state = defaultState, action) {
  switch (action.type) {
    case OPEN_ANIMATION:
      return {
        ...state,
        isActive: true,
        gifActive: false,
      };
    case EXIT_ANIMATION:
      return {
        ...state,
        isActive: false,
        gifActive: false,
        isPlaying: false,
      };
    case PLAY_ANIMATION:
      return {
        ...state,
        isPlaying: true,
        gifActive: false,
      };
    case STOP_ANIMATION:
      return {
        ...state,
        isPlaying: false,
      };
    case UPDATE_FRAME_RATE:
      return {
        ...state,
        speed: action.value,
      };
    case UPDATE_START_AND_END_DATE:
      return {
        ...state,
        startDate: action.startDate,
        endDate: action.endDate,
        isPlaying: false,
      };
    case UPDATE_START_DATE:
      return {
        ...state,
        startDate: action.value,
        isPlaying: false,
      };
    case UPDATE_END_DATE:
      return {
        ...state,
        endDate: action.value,
        isPlaying: false,
      };
    case UPDATE_CROP_BOUNDS:
      return {
        ...state,
        boundaries: action.value,
      };
    case TOGGLE_LOOPING:
      return {
        ...state,
        loop: !state.loop,
      };
    case TOGGLE_GIF:
      return {
        ...state,
        gifActive: !state.gifActive,
        isPlaying: false,
      };
    case COLLAPSE_ANIMATION:
      return {
        ...state,
        isCollapsed: !state.isCollapsed,
      };
    case TOGGLE_AUTOPLAY:
      return {
        ...state,
        autoplay: !state.autoplay,
      };
    case KEY_PRESS_ACTION:
      if (action.keyCode === 32 && state.isActive) {
        return {
          ...state,
          isPlaying: !state.isPlaying,
        };
      }
      if (action.keyCode === 27) {
        return {
          ...state,
          isActive: false,
          gifActive: false,
          isPlaying: false,
        };
      }
      return state;
    case PLAY_KIOSK_ANIMATIONS:
      return {
        ...state,
        loop: true,
        speed: 6,
        startDate: action.startDate,
        endDate: action.endDate,
        isPlaying: true,
      };

    default:
      return state;
  }
}
