import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  SELECT_DATE,
  UPDATE_APP_NOW
} from './constants';

export function changeTimeScale(num) {
  return {
    type: CHANGE_TIME_SCALE,
    value: num
  };
}
export function updateAppNow(date) {
  return {
    type: UPDATE_APP_NOW,
    value: date
  };
}
export function selectDate(value) {
  return (dispatch, getState) => {
    const compareState = getState().compare;
    const activeString = compareState.isCompareA ? 'selected' : 'selectedB';

    dispatch({
      type: SELECT_DATE,
      activeString,
      value
    });
  };
}
export function changeCustomInterval(delta, customInterval) {
  return {
    type: CHANGE_CUSTOM_INTERVAL,
    value: customInterval,
    delta: delta
  };
}
export function selectInterval(delta, interval, customSelected) {
  return {
    type: CHANGE_INTERVAL,
    value: interval,
    delta: delta,
    customSelected: Boolean(customSelected)
  };
}
