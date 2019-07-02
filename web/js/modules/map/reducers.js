import { assign as lodashAssign } from 'lodash';
import {
  RUNNING_DATA,
  CLEAR_RUNNING_DATA,
  UPDATE_MAP_EXTENT,
  UPDATE_MAP_UI,
  UPDATE_MAP_ROTATION
} from './constants';
import update from 'immutability-helper';
const INITIAL_STATE = {
  runningDataObj: {},
  ui: { selected: null },
  rotation: 0,
  extent: []
};

export default function mapReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case RUNNING_DATA:
      return lodashAssign({}, state, {
        runningDataObj: action.payload
      });
    case CLEAR_RUNNING_DATA:
      return lodashAssign({}, state, {
        runningDataObj: {}
      });
    case UPDATE_MAP_EXTENT:
      return update(state, { extent: { $set: action.extent } });
    case UPDATE_MAP_UI:
      return update(state, { ui: { $set: action.ui } });
    case UPDATE_MAP_ROTATION:
      return update(state, { rotation: { $set: action.rotation } });
    default:
      return state;
  }
}
