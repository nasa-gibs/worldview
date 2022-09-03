import {
  SET_SCREEN_INFO,
} from './constants';

export function setScreenInfo(screenHeight, screenWidth, isMobileDevice, orientation) {
  return {
    type: SET_SCREEN_INFO,
    screenHeight, screenWidth, isMobileDevice, orientation,
  };
}