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
  console.log('getInitialVectorStyleState');
  const custom = lodashGet(config, 'vectorStyles') || {};
  const x = lodashAssign({}, defaultVectorStyleState, {
    custom,
  });
  console.log('x', x);
  return x;
}

export function vectorStyleReducer(state = defaultVectorStyleState, action) {
  // console.log(`vectorStyleReducer - action.type: ${action.type}`);

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
