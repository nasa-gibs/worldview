import { initSecondLayerGroup } from '../layers/actions';
import { initSecondDate } from '../date/actions';
import {
  TOGGLE_ON_OFF,
  TOGGLE_AOI_ON_OFF,
  // TOGGLE_DATE_MODE,
  // UPDATE_START_DATE,
  // UPDATE_END_DATE,
} from './constants';

export function toggleChartingOnOff() {
  return (dispatch, getState) => {
    if (!getState().charting.active) {
      dispatch(initSecondLayerGroup());
      dispatch(initSecondDate());
    }
    dispatch({ type: TOGGLE_ON_OFF });
  };
}
export function toggleChartingAOIOnOff() {
  console.log('toggleChartingAOIOnOff running');
  return (dispatch, getState) => {
    dispatch({ type: TOGGLE_AOI_ON_OFF });
  };
}
