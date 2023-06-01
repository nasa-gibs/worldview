import { assign as lodashAssign, get as lodashGet } from 'lodash';
import {
  CLEAR_VECTORSTYLE,
  SET_VECTORSTYLE,
  SET_FILTER_RANGE,
  SET_SELECTED_VECTORS,
} from './constants';

export const defaultVectorStyleState = {
  custom: {},
  active: {},
  activeB: {},
  selected: {},
};
export function getInitialVectorStyleState(config) {
  const custom = lodashGet(config, 'vectorStyles') || {};
  return lodashAssign({}, defaultVectorStyleState, {
    custom,
  });
}

export function vectorStyleReducer(state = defaultVectorStyleState, action) {
  const groupName = action.groupName || 'active';
  switch (action.type) {
    case SET_FILTER_RANGE:
      return lodashAssign({}, state, {
        [groupName]: action.vectorStyles,
      });
    case CLEAR_VECTORSTYLE:
      return lodashAssign({}, state, {
        [groupName]: action.vectorStyles || {},
      });
    case SET_VECTORSTYLE:
      return lodashAssign({}, state, {
        [groupName]: action.vectorStyles,
      });
    case SET_SELECTED_VECTORS:
      return lodashAssign({}, state, {
        selected: action.payload,
      });
    default:
      return state;
  }
}
