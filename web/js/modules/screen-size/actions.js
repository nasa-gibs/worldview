import {
  SET_SCREEN_INFO,
} from './constants';

export function setScreenInfo(value) {
  return {
    type: SET_SCREEN_INFO,
    value,
  };
}