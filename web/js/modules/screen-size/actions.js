import {
  SET_SCREEN_INFO,
} from './constants';

export default function setScreenInfo(screenHeight, screenWidth, isMobileDevice, orientation) {
  return {
    type: SET_SCREEN_INFO,
    screenHeight,
    screenWidth,
    isMobileDevice,
    orientation,
  };
}
