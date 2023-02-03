import { initSecondLayerGroup } from '../layers/actions';
import { initSecondDate, clearPreload } from '../date/actions';
import {
  CHANGE_STATE,
  TOGGLE_ON_OFF,
  CHANGE_VALUE,
  CHANGE_MODE,
} from './constants';

export function toggleActivechartingState() {
  return (dispatch, getState) => {
    dispatch(clearPreload());
    dispatch({ type: CHANGE_STATE });
  };
}
export function togglechartingOnOff() {
  return (dispatch, getState) => {
    if (!getState().charting.bStatesInitiated) {
      dispatch(initSecondLayerGroup());
      dispatch(initSecondDate());
    }
    dispatch({ type: TOGGLE_ON_OFF });
  };
}
export function toggleActiveChartingState() {
  return (dispatch, getState) => {
    dispatch(clearPreload());
    dispatch({ type: CHANGE_STATE });
  };
}
export function toggleChartingOnOff() {
  return (dispatch, getState) => {
    if (!getState().charting.bStatesInitiated) {
      dispatch(initSecondLayerGroup());
      dispatch(initSecondDate());
    }
    dispatch({ type: TOGGLE_ON_OFF });
  };
}
export function setValue(num) {
  return { type: CHANGE_VALUE, value: num };
}
export function changeChartingMode(str) {
  return { type: CHANGE_MODE, mode: str };
}
