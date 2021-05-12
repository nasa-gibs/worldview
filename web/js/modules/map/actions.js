import {
  CLEAR_ROTATE, CHANGE_CURSOR, REFRESH_ROTATE,
} from './constants';

export function clearRotate() {
  return {
    type: CLEAR_ROTATE,
  };
}
export function refreshRotation(number) {
  return {
    type: REFRESH_ROTATE,
    rotation: number,
  };
}

export function changeCursor(bool) {
  return {
    type: CHANGE_CURSOR,
    bool,
  };
}
