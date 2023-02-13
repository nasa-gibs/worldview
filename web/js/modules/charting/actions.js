import { initSecondLayerGroup } from '../layers/actions';
import { initSecondDate } from '../date/actions';
import {
  TOGGLE_ON_OFF,
  TOGGLE_AOI_ON_OFF,
  // TOGGLE_DATE_MODE,
  // UPDATE_START_DATE,
  // UPDATE_END_DATE,
} from './constants';

export function toggleChartingModeOnOff() {
  console.log('toggleChartingModeOnOff running');
  return (dispatch) => {
    dispatch({ type: TOGGLE_ON_OFF });
  };
}
export function toggleChartingAOIOnOff() {
  return (dispatch) => {
    dispatch({ type: TOGGLE_AOI_ON_OFF });
  };
}
export function toggleAOIActive() {
  console.log('toggleAOIActive running');
  return (dispatch) => {
    dispatch({ type: TOGGLE_AOI_ON_OFF });
  };
}
