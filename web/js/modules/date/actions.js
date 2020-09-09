import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  SELECT_DATE,
  UPDATE_APP_NOW,
  TOGGLE_CUSTOM_MODAL,
  INIT_SECOND_DATE,
} from './constants';

export function changeTimeScale(num) {
  return {
    type: CHANGE_TIME_SCALE,
    value: num,
  };
}
export function updateAppNow(date) {
  return {
    type: UPDATE_APP_NOW,
    value: date,
  };
}
export function initSecondDate() {
  return {
    type: INIT_SECOND_DATE,
  };
}
export function selectDate(value) {
  return (dispatch, getState) => {
    const state = getState();
    const { compare, date } = state;
    const activeString = compare.isCompareA ? 'selected' : 'selectedB';
    const { appNow } = date;

    const selectedDate = value > appNow
      ? appNow
      : value;

    dispatch({
      type: SELECT_DATE,
      activeString,
      value: selectedDate,
    });
  };
}
export function changeCustomInterval(delta, customInterval) {
  return {
    type: CHANGE_CUSTOM_INTERVAL,
    value: customInterval,
    delta,
  };
}
export function selectInterval(delta, interval, customSelected) {
  return {
    type: CHANGE_INTERVAL,
    value: interval,
    delta,
    customSelected,
  };
}
export function toggleCustomModal(open, toggleBy) {
  return {
    type: TOGGLE_CUSTOM_MODAL,
    value: open,
    toggleBy,
  };
}
