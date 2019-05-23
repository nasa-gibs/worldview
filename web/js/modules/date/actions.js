import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  // CHANGE_DELTA,
  SELECT_DATE
} from './constants';

export function changeTimeScale(num) {
  return {
    type: CHANGE_TIME_SCALE,
    value: num
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
  console.log(delta, customInterval)
  return {
    type: CHANGE_CUSTOM_INTERVAL,
    value: customInterval,
    delta: delta
  };
}
export function selectInterval(delta, interval, customSelected) {
  console.log(delta, interval)
  return {
    type: CHANGE_INTERVAL,
    value: interval,
    delta: delta,
    customSelected
  };
}
// export function selectDelta(delta) {
//   return {
//     type: CHANGE_DELTA,
//     value: delta
//   };
// }
