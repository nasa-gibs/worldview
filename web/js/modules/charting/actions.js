import { initSecondLayerGroup } from '../layers/actions';
import { initSecondDate, clearPreload } from '../date/actions';
import {
  CHANGE_STATE,
  TOGGLE_ON_OFF,
  CHANGE_VALUE,
} from './constants';

export function toggleActiveChartingState() {
  return (dispatch, getState) => {
    dispatch(clearPreload());
    dispatch({ type: CHANGE_STATE });
  };
}
export function toggleChartingOnOff() {
  return (dispatch, getState) => {
    if (!getState().charting.active) {
      dispatch(initSecondLayerGroup());
      dispatch(initSecondDate());
    }
    dispatch({ type: TOGGLE_ON_OFF });
  };
}
export function setValue(num) {
  return { type: CHANGE_VALUE, value: num };
}
