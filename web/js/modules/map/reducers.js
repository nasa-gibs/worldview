import { assign as lodashAssign } from 'lodash';
import {
  RUNNING_DATA,
  CLEAR_RUNNING_DATA,
  UPDATE_MAP_EXTENT,
  UPDATE_MAP_UI,
  UPDATE_MAP_ROTATION,
  RENDERED,
  FITTED_TO_LEADING_EXTENT,
  CHANGE_CURSOR,
  REFRESH_ROTATE
} from './constants';
import update from 'immutability-helper';
const INITIAL_STATE = {
  runningDataObj: {},
  ui: { selected: null },
  rotation: 0,
  extent: [],
  rendered: false,
  leadingExtent: [],
  isClickable: false

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
      return lodashAssign({}, state, {
        ui: action.ui,
        rotation: action.rotation
      });
    case UPDATE_MAP_ROTATION:
    case REFRESH_ROTATE:
      return update(state, { rotation: { $set: action.rotation } });
    case RENDERED:
      return lodashAssign({}, state, {
        rendered: true
      });
    case FITTED_TO_LEADING_EXTENT:
      return lodashAssign({}, state, {
        leadingExtent: action.extent
      });
    case CHANGE_CURSOR:
      return lodashAssign({}, state, {
        isClickable: action.bool
      });
    default:
      return state;
  }
}
