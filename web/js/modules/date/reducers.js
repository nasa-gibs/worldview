import {
  UPDATE_ZOOM_LEVEL,
  CUSTOM_INTERVAL_CHANGE,
  INTERVAL_CHANGE,
  SELECT_DATE
} from './constants';
import util from '../../util/util';
import { assign as lodashAssign } from 'lodash';

const defaultState = {
  selectedZoom: 3,
  interval: 1,
  selected: util.now(),
  selectedB: util.dateAdd(),
  customSelected: false,
  customDelta: null,
  customInterval: null
};

export function timelineReducer(state = defaultState, action) {
  switch (action.type) {
    case UPDATE_ZOOM_LEVEL:
      return lodashAssign({}, state, {
        selectedZoom: action.value
      });
    case CUSTOM_INTERVAL_CHANGE:
      return lodashAssign({}, state, {
        customIncrement: action.value,
        customSelected: true
      });
    case INTERVAL_CHANGE:
      return lodashAssign({}, state, {
        interval: action.value,
        customSelected: false
      });
    case SELECT_DATE:
      return lodashAssign({}, state, {
        [action.activeString]: action.value
      });
    default:
      return state;
  }
}
