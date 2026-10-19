import { updateBoundaries, onPanelChange } from './actions';

describe('actions module', () => {
  it('should create an action to update boundaries', () => {
    const boundaries = { left: 1, right: 2, top: 3, bottom: 4 };
    const expectedAction = {
      type: 'IMAGE-DOWNLOAD/UPDATE_BOUNDARIES',
      boundaries,
    };
    expect(updateBoundaries(boundaries)).toEqual(expectedAction);
  });

  it('should create an action to update file type', () => {
    const value = 'png';
    const expectedAction = {
      type: 'IMAGE-DOWNLOAD/UPDATE_FILE_TYPE',
      value,
    };
    expect(onPanelChange('fileType', value)).toEqual(expectedAction);
  });

  it('should create an action to update resolution', () => {
    const value = '300';
    const expectedAction = {
      type: 'IMAGE-DOWNLOAD/UPDATE_RESOLUTION',
      value,
    };
    expect(onPanelChange('resolution', value)).toEqual(expectedAction);
  });

  it('should create an action to update worldfile', () => {
    const value = true;
    const expectedAction = {
      type: 'IMAGE-DOWNLOAD/UPDATE_WORLDFILE',
      value,
    };
    expect(onPanelChange('worldfile', value)).toEqual(expectedAction);
  });
});
