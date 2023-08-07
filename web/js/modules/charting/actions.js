import {
  TOGGLE_ON_OFF,
  TOGGLE_AOI_ON_OFF,
  UPDATE_AOI_COORDINATES,
  TOGGLE_AOI_SELECTED_ON_OFF,
  TOGGLE_REQUEST_IN_PROGRESS,
  UPDATE_CHARTING_DATE_SELECTION,
  UPDATE_START_DATE,
  UPDATE_END_DATE,
  UPDATE_ACTIVE_CHART,
  UPDATE_REQUEST_STATUS_MESSAGE,
} from './constants';

export function toggleChartingModeOnOff() {
  return (dispatch) => {
    dispatch({ type: TOGGLE_ON_OFF });
  };
}
export function toggleChartingAOIOnOff() {
  return (dispatch) => {
    dispatch({ type: TOGGLE_AOI_ON_OFF });
  };
}
export function updateRequestInProgressAction(status) {
  return (dispatch) => {
    dispatch({ type: TOGGLE_REQUEST_IN_PROGRESS, status });
  };
}
export function updateRequestStatusMessageAction(message) {
  return (dispatch) => {
    dispatch({ type: UPDATE_REQUEST_STATUS_MESSAGE, message });
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
export function changeChartingStartDate(date) {
  return (dispatch) => {
    dispatch({ type: UPDATE_START_DATE, date });
  };
}
export function changeChartingEndDate(date) {
  return (dispatch) => {
    dispatch({ type: UPDATE_END_DATE, date });
  };
}
export function updateActiveChartingLayerAction(layerId) {
  return (dispatch) => {
    dispatch({ type: UPDATE_ACTIVE_CHART, layerId });
  };
}
