import {
  UPDATE_ZOOM_LEVEL,
  CUSTOM_INTERVAL_CHANGE,
  INTERVAL_CHANGE
} from './constants';
import { assign as lodashAssign } from 'lodash';

const defaultState = {
  isCustomInterval: false,
  zoomLevel: 3,
  increment: 1
};

export function timelineReducer(state = defaultState, action) {
  switch (action.type) {
    case UPDATE_ZOOM_LEVEL:
      return lodashAssign({}, state, {
        zoomLevel: action.value
      });
    case CUSTOM_INTERVAL_CHANGE:
      return lodashAssign({}, state, {
        customIncrement: action.value,
        isCustomInterval: true
      });
    case INTERVAL_CHANGE:
      return lodashAssign({}, state, {
        increment: action.value,
        isCustomInterval: false
      });
    default:
      return state;
  }
}
