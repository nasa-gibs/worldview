import {
  RUNNING_DATA, CLEAR_RUNNING_DATA, CLEAR_ROTATE, CHANGE_CURSOR, REFRESH_ROTATE,
} from './constants';

export function runningData(payload) {
  return {
    type: RUNNING_DATA,
    payload,
  };
}

export function clearRunningData() {
  return {
    type: CLEAR_RUNNING_DATA,
  };
}

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
