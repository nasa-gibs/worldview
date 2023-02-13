// import { initSecondLayerGroup } from '../layers/actions';
// import { initSecondDate } from '../date/actions';
import {
  TOGGLE_ON_OFF,
  TOGGLE_AOI_ON_OFF,
  UPDATE_AOI_COORDINATES,
  TOGGLE_AOI_SELECTED_ON_OFF,
  // TOGGLE_DATE_MODE,
  // UPDATE_START_DATE,
  // UPDATE_END_DATE,
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
  console.log('toggleAOISelected');
  return (dispatch) => {
    dispatch({ type: TOGGLE_AOI_SELECTED_ON_OFF, action });
  };
}
export function updateChartingAOICoordinates(extent) {
  return (dispatch) => {
    dispatch({ type: UPDATE_AOI_COORDINATES, extent });
  };
}
