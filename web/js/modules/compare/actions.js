import { initSecondLayerGroup } from '../layers/actions';
import { initSecondDate } from '../date/actions';
import {
  CHANGE_STATE,
  TOGGLE_ON_OFF,
  CHANGE_VALUE,
  CHANGE_MODE,
} from './constants';

export function toggleActiveCompareState() {
  return {
    type: CHANGE_STATE,
  };
}
export function toggleCompareOnOff() {
  return (dispatch, getState) => {
    if (!getState().compare.bStatesInitiated) {
      dispatch(initSecondLayerGroup());
      dispatch(initSecondDate());
    }
    dispatch({ type: TOGGLE_ON_OFF });
  };
}
export function setValue(num) {
  return { type: CHANGE_VALUE, value: num };
}
export function changeMode(str) {
  return { type: CHANGE_MODE, mode: str };
}
