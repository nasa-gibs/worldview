import { RUNNING_DATA, CLEAR_RUNNING_DATA } from './constants';

export function runningData(payload) {
  return {
    type: RUNNING_DATA,
    payload: payload
  };
}

export function clearRunningData() {
  return {
    type: CLEAR_RUNNING_DATA
  };
}
