import { assign as lodashAssign, find as lodashFind } from 'lodash';
import {
  UPDATE_BOUNDARIES,
  UPDATE_FILE_TYPE,
  UPDATE_WORLDFILE,
  UPDATE_RESOLUTION,
  fileTypesPolar,
} from './constants';
import { CHANGE_PROJECTION } from '../projection/constants';

export const defaultState = {
  fileType: 'image/jpeg',
  boundaries: undefined,
  isWorldfile: false,
  resolution: '',
};

export function imageDownloadReducer(state = defaultState, action) {
  switch (action.type) {
    case UPDATE_BOUNDARIES:
      return lodashAssign({}, state, {
        boundaries: action.boundaries,
      });
    case UPDATE_FILE_TYPE:
      return lodashAssign({}, state, {
        fileType: action.value,
      });
    case UPDATE_WORLDFILE:
      return lodashAssign({}, state, {
        isWorldfile: action.value,
      });
    case UPDATE_RESOLUTION:
      return lodashAssign({}, state, {
        resolution: action.value,
      });
    case CHANGE_PROJECTION: {
      const fileType = action.selected !== 'geographic'
        && !lodashFind(fileTypesPolar.values, { value: state.fileType })
        ? 'image/jpeg'
        : state.fileType;
      return lodashAssign({}, defaultState, { fileType });
    }
    default:
      return state;
  }
}
