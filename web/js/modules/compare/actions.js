import { initSecondLayerGroup } from '../layers/actions';
import {
  CHANGE_STATE,
  TOGGLE_ON_OFF,
  ACTIVATE,
  DEACTIVATE,
  CHANGE_VALUE,
  CHANGE_MODE
} from './constants';

export function toggleActiveCompareState(str) {
  return {
    type: CHANGE_STATE
  };
}
export function toggleCompareOnOff() {
  return (dispatch, getState) => {
    if (!getState().layers.hasSecondLayerGroup) {
      dispatch(initSecondLayerGroup());
    }
    dispatch({
      type: TOGGLE_ON_OFF
    });
  };
}

export function activateCompare(isActive) {
  return {
    type: ACTIVATE
  };
}

export function deactivateCompare(str) {
  return {
    type: DEACTIVATE
  };
}
export function setValue(num) {
  return {
    type: CHANGE_VALUE,
    value: num
  };
}
export function changeMode(str) {
  return {
    type: CHANGE_MODE,
    mode: str
  };
}
