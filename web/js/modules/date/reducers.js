import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  // CHANGE_DELTA,
  SELECT_DATE
} from './constants';
import util from '../../util/util';
import { assign as lodashAssign } from 'lodash';

const defaultState = {
  selectedZoom: 3,
  interval: 3,
  delta: 1,
  selected: util.now(),
  selectedB: util.dateAdd(util.now(), 'day', -7),
  customSelected: false,
  customDelta: 1,
  customInterval: 3
};

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
    // case CHANGE_DELTA:
    //   return lodashAssign({}, state, {
    //     delta: action.value
    //   });
    case SELECT_DATE:
      console.log(action.value)
      return lodashAssign({}, state, {
        [action.activeString]: action.value
      });
    default:
      return state;
  }
}
