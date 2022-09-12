import {
  SET_SCREEN_INFO,
} from './constants';
import { isMobileOnly, isTablet } from 'react-device-detect';

export default function setScreenInfo() {
  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;
  const isMobileDevice = screenWidth < 768 || isMobileOnly || isTablet;
  const orientation = screenHeight > screenWidth ? 'portrait' : 'landscape';

  return {
    type: SET_SCREEN_INFO,
    screenHeight,
    screenWidth,
    isMobileDevice,
    orientation,
  };
}
