import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  SELECT_DATE,
  UPDATE_APP_NOW,
  TOGGLE_CUSTOM_MODAL,
  INIT_SECOND_DATE,
  ARROW_DOWN,
  ARROW_UP,
  SET_PRELOAD,
  CLEAR_PRELOAD,
} from './constants';
import { getSelectedDate } from './selectors';
import { getMaxActiveLayersDate, outOfStepChange } from './util';

export function triggerTodayButton() {
  return (dispatch, getState) => {
    const state = getState();
    const {
      date,
      compare,
    } = state;
    const activeString = compare.isCompareA ? 'selected' : 'selectedB';
    const selectedDate = getSelectedDate(state, activeString);
    const { appNow } = date;

    const selectedDateTime = selectedDate.getTime();
    const appNowTime = appNow.getTime();
    if (selectedDateTime !== appNowTime) {
      dispatch({
        type: SELECT_DATE,
        activeString,
        value: appNow,
      });
    }
  };
}

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
export function selectDate(date) {
  return (dispatch, getState) => {
    const state = getState();
    const { lastArrowDirection } = state.date;
    const activeString = state.compare.isCompareA ? 'selected' : 'selectedB';
    const prevDate = getSelectedDate(state);
    const maxDate = getMaxActiveLayersDate(state);
    const selectedDate = date > maxDate ? maxDate : date;
    const direction = selectedDate > prevDate ? 'right' : 'left';
    const directionChange = direction && lastArrowDirection !== direction;

    if (directionChange || outOfStepChange(state, selectedDate)) {
      dispatch(clearPreload());
    }
    dispatch({
      type: SELECT_DATE,
      activeString,
      value: selectedDate,
      lastArrowDirection: direction,
    });
  };
}
export function changeCustomInterval(delta, customInterval) {
  return (dispatch, getState) => {
    dispatch(clearPreload());
    dispatch({
      type: CHANGE_CUSTOM_INTERVAL,
      value: customInterval,
      delta,
    });
  };
}
export function selectInterval(delta, interval, customSelected) {
  return (dispatch, getState) => {
    dispatch(clearPreload());
    dispatch({
      type: CHANGE_INTERVAL,
      value: interval,
      delta,
      customSelected,
    });
  };
}
export function toggleCustomModal(open, toggleBy) {
  return {
    type: TOGGLE_CUSTOM_MODAL,
    value: open,
    toggleBy,
  };
}
export function setArrowDown (direction) {
  return (dispatch, getState) => {
    const { date } = getState();
    const { lastArrowDirection } = date;
    const directionChange = direction && lastArrowDirection !== direction;
    if (directionChange) {
      dispatch(clearPreload());
    }
    dispatch({
      type: ARROW_DOWN,
      value: direction,
    });
  };
}
export function setArrowUp () {
  return {
    type: ARROW_UP,
  };
}
export function setPreload (preloaded, lastPreloadDate) {
  return {
    type: SET_PRELOAD,
    preloaded,
    lastPreloadDate,
  };
}
export function clearPreload () {
  return {
    type: CLEAR_PRELOAD,
  };
}
