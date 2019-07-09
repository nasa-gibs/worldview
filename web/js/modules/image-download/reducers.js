import {
  UPDATE_BOUNDARIES,
  UPDATE_FILE_TYPE,
  UPDATE_WORLDFILE,
  UPDATE_RESOLUTION
} from './constants';
import { assign as lodashAssign } from 'lodash';
export const defaultState = {
  fileType: 'image/jpeg',
  boundaries: {},
  isWorldfile: false,
  resolution: ''
};

export function imageDownloadReducer(state = defaultState, action) {
  switch (action.type) {
    case UPDATE_BOUNDARIES:
      return lodashAssign({}, state, {
        boundaries: action.boundaries
      });
    case UPDATE_FILE_TYPE:
      return lodashAssign({}, state, {
        fileType: action.value
      });
    case UPDATE_WORLDFILE:
      return lodashAssign({}, state, {
        isWorldfile: action.value
      });
    case UPDATE_RESOLUTION:
      return lodashAssign({}, state, {
        resolution: action.value
      });
    default:
      return state;
  }
}
