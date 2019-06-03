import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  SELECT_DATE
} from './constants';
import util from '../../util/util';
import { assign as lodashAssign } from 'lodash';

const defaultState = {
  selectedZoom: 3,
  interval: 3,
  delta: 1,
  customSelected: false,
  customDelta: undefined,
  customInterval: undefined
};

export function getInitialState(config) {
  return lodashAssign({}, defaultState, {
    selected: config.now,
    selectedB: util.dateAdd(config.now, 'day', -7)
  });
}

export function dateReducer(state = defaultState, action) {
  switch (action.type) {
    case CHANGE_TIME_SCALE:
      return lodashAssign({}, state, {
        selectedZoom: action.value
      });
    case CHANGE_CUSTOM_INTERVAL:
      return lodashAssign({}, state, {
        customInterval: action.value,
        customDelta: action.delta,
        customSelected: true
      });
    case CHANGE_INTERVAL:
      return lodashAssign({}, state, {
        interval: action.value,
        delta: action.delta,
        customSelected: action.customSelected
      });
    case SELECT_DATE:
      return lodashAssign({}, state, {
        [action.activeString]: action.value
      });
    default:
      return state;
  }
}
