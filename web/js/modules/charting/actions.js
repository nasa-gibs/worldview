import {
  TOGGLE_ON_OFF,
  TOGGLE_AOI_ON_OFF,
  UPDATE_AOI_COORDINATES,
  TOGGLE_AOI_SELECTED_ON_OFF,
  UPDATE_CHARTING_DATE_SELECTION,
  UPDATE_START_DATE,
  UPDATE_END_DATE,
} from './constants';

export function toggleChartingModeOnOff() {
  return (dispatch) => {
    dispatch({ type: TOGGLE_ON_OFF });
  };
}
export function toggleChartingAOIOnOff() {
  return (dispatch) => {
    dispatch({ type: TOGGLE_AOI_ON_OFF });
    // toggleAOISelected();
  };
}
export function toggleAOISelected(action = null) {
  return (dispatch) => {
    dispatch({ type: TOGGLE_AOI_SELECTED_ON_OFF, action });
  };
}
export function updateChartingDateSelection(buttonClicked) {
  return (dispatch) => {
    dispatch({ type: UPDATE_CHARTING_DATE_SELECTION, buttonClicked });
  };
}
export function updateChartingAOICoordinates(extent) {
  return (dispatch) => {
    dispatch({ type: UPDATE_AOI_COORDINATES, extent });
  };
}
export function changeStartDate(date) {
  return (dispatch) => {
    dispatch({ type: UPDATE_START_DATE, date });
  };
}
export function changeEndDate(date) {
  console.log('ACTION changing end date');
  // return {
  //   type: UPDATE_END_DATE,
  //   value: date,
  // };
  return (dispatch) => {
    dispatch({ type: UPDATE_END_DATE, date });
  };
}
