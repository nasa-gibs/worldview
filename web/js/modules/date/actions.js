import {
  UPDATE_ZOOM_LEVEL,
  CUSTOM_INTERVAL_CHANGE,
  INTERVAL_CHANGE,
  SELECT_DATE
} from './constants';

export function updateZoomLevel(num) {
  return {
    type: UPDATE_ZOOM_LEVEL,
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
export function customIntervalChange(delta, customInterval) {
  return {
    type: CUSTOM_INTERVAL_CHANGE,
    customInterval,
    value: delta
  };
}
export function intervalChange(value) {
  return {
    type: INTERVAL_CHANGE,
    value
  };
}
