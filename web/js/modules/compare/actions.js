import {
  CHANGE_STATE,
  TOGGLE,
  ACTIVATE,
  DEACTIVATE,
  CHANGE_VALUE,
  CHANGE_MODE
} from './constants';

export function toggleActiveCompareState(str) {
  return {
    type: CHANGE_STATE,
    stateStr: str
  };
}
export function toggleCompare() {
  return {
    type: TOGGLE
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
export function setNumber(num) {
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
