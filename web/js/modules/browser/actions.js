import { SCREEN_RESIZE } from './constants';

export function screenResize(width, height) {
  return {
    type: SCREEN_RESIZE,
    screenWidth: width,
    screenHeight: height
  };
}
