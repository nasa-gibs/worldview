import { imageDownloadReducer, defaultState } from './reducers';
import { assign as lodashAssign } from 'lodash';
import {
  UPDATE_BOUNDARIES,
  UPDATE_FILE_TYPE,
  UPDATE_WORLDFILE,
  UPDATE_RESOLUTION,
} from './constants';
import { CHANGE_PROJECTION } from '../projection/constants';

describe('imageDownloadReducer', () => {
  it('should return the default state', () => {
    expect(imageDownloadReducer(undefined, {})).toEqual(defaultState);
  });
  it('should update boundaries', () => {
    const boundaries = [1, 2, 3, 4];
    expect(imageDownloadReducer(undefined, {
      type: UPDATE_BOUNDARIES,
      boundaries,
    })).toEqual(lodashAssign({}, defaultState, { boundaries }));
  });

  it('should update file type', () => {
    const fileType = 'image/png';
    expect(imageDownloadReducer(undefined, {
      type: UPDATE_FILE_TYPE,
      value: fileType,
    })).toEqual(lodashAssign({}, defaultState, { fileType }));
  });

  it('should update worldfile', () => {
    const isWorldfile = true;
    expect(imageDownloadReducer(undefined, {
      type: UPDATE_WORLDFILE,
      value: isWorldfile,
    })).toEqual(lodashAssign({}, defaultState, { isWorldfile }));
  });

  it('should update resolution', () => {
    const resolution = '10';
    expect(imageDownloadReducer(undefined, {
      type: UPDATE_RESOLUTION,
      value: resolution,
    })).toEqual(lodashAssign({}, defaultState, { resolution }));
  });

  it('should change projection and reset to default state', () => {
    const selected = 'geographic';
    expect(imageDownloadReducer(undefined, {
      type: CHANGE_PROJECTION,
      selected,
    })).toEqual(defaultState);
  });

  it('should change projection and reset to default state with file type image/jpeg', () => {
    const selected = 'polar';
    const fileType = 'image/png';
    expect(imageDownloadReducer(lodashAssign({}, defaultState, { fileType }), {
      type: CHANGE_PROJECTION,
      selected,
    })).toEqual(lodashAssign({}, defaultState, { fileType: 'image/png' }));
  });
});
