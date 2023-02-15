import {
  TOGGLE_ON_OFF,
  TOGGLE_AOI_ON_OFF,
  UPDATE_AOI_COORDINATES,
  TOGGLE_AOI_SELECTED_ON_OFF,
  UPDATE_CHARTING_DATE_SELECTION,
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
