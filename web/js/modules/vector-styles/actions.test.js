import {
  setFilterRange,
  setStyle,
  clearStyle,
  selectVectorFeatures,
} from './actions';
import {
  SET_FILTER_RANGE,
  CLEAR_VECTORSTYLE,
  SET_VECTORSTYLE,
  SET_SELECTED_VECTORS,
} from './constants';
import {
  setRange as setRangeSelector,
  setStyleFunction,
} from './selectors';

jest.mock('./selectors', () => ({
  setRange: jest.fn(),
  setStyleFunction: jest.fn(),
}));

jest.mock('./constants', () => ({
  SET_FILTER_RANGE: 'SET_FILTER_RANGE',
  CLEAR_VECTORSTYLE: 'CLEAR_VECTORSTYLE',
  SET_VECTORSTYLE: 'SET_VECTORSTYLE',
  SET_SELECTED_VECTORS: 'SET_SELECTED_VECTORS',
}));

describe('actions.js', () => {
  let dispatch;
  let getState;
  const groupName = 'active';
  const layerId = 'layer-1';
  const vectorStyleId = 'style-1';
  const layer = { id: layerId };
  const mockVectorStylesObj = { some: 'styles' };
  const mockState = {
    vectorStyles: {
      custom: { existing: 'style' },
      [groupName]: { rangeData: true },
    },
  };

  beforeEach(() => {
    dispatch = jest.fn();
    getState = jest.fn().mockReturnValue(mockState);
    setRangeSelector.mockReturnValue(mockVectorStylesObj);
    setStyleFunction.mockReturnValue(mockVectorStylesObj);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setFilterRange', () => {
    const props = { min: 0, max: 100, squash: false, noclip: false };
    const index = 0;

    it('should return a thunk', () => {
      const thunk = setFilterRange(layerId, props, index, groupName);
      expect(typeof thunk).toBe('function');
    });

    it('should call getState', () => {
      const thunk = setFilterRange(layerId, props, index, groupName);
      thunk(dispatch, getState);
      expect(getState).toHaveBeenCalledTimes(1);
    });

    it('should call setRangeSelector with correct arguments', () => {
      const thunk = setFilterRange(layerId, props, index, groupName);
      thunk(dispatch, getState);
      expect(setRangeSelector).toHaveBeenCalledWith(
        layerId,
        props,
        index,
        mockState.vectorStyles[groupName],
        mockState,
      );
    });

    it('should dispatch SET_FILTER_RANGE with correct payload', () => {
      const thunk = setFilterRange(layerId, props, index, groupName);
      thunk(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: SET_FILTER_RANGE,
        groupName,
        activeString: groupName,
        layerId,
        vectorStyles: mockVectorStylesObj,
        props,
      });
    });

    it('should dispatch with the returned vectorStyles from setRangeSelector', () => {
      const customStyles = { custom: 'result' };
      setRangeSelector.mockReturnValue(customStyles);
      const thunk = setFilterRange(layerId, props, index, groupName);
      thunk(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ vectorStyles: customStyles }),
      );
    });
  });

  describe('setStyle', () => {
    it('should return a thunk', () => {
      const thunk = setStyle(layer, vectorStyleId, groupName);
      expect(typeof thunk).toBe('function');
    });

    it('should call getState', () => {
      const thunk = setStyle(layer, vectorStyleId, groupName);
      thunk(dispatch, getState);
      expect(getState).toHaveBeenCalledTimes(1);
    });

    it('should call setStyleFunction with correct arguments', () => {
      const thunk = setStyle(layer, vectorStyleId, groupName);
      thunk(dispatch, getState);
      expect(setStyleFunction).toHaveBeenCalledWith(
        layer,
        vectorStyleId,
        mockState.vectorStyles.custom,
        null,
        mockState,
      );
    });

    it('should dispatch SET_VECTORSTYLE with correct payload', () => {
      const thunk = setStyle(layer, vectorStyleId, groupName);
      thunk(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: SET_VECTORSTYLE,
        layerId: layer.id,
        vectorStyleId,
        groupName,
        activeString: groupName,
        vectorStyles: mockVectorStylesObj,
      });
    });

    it('should dispatch with the returned vectorStyles from setStyleFunction', () => {
      const customStyles = { updated: 'vectorStyle' };
      setStyleFunction.mockReturnValue(customStyles);
      const thunk = setStyle(layer, vectorStyleId, groupName);
      thunk(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ vectorStyles: customStyles }),
      );
    });
  });

  describe('clearStyle', () => {
    it('should return a thunk', () => {
      const thunk = clearStyle(layer, vectorStyleId, groupName);
      expect(typeof thunk).toBe('function');
    });

    it('should call getState', () => {
      const thunk = clearStyle(layer, vectorStyleId, groupName);
      thunk(dispatch, getState);
      expect(getState).toHaveBeenCalledTimes(1);
    });

    it('should call setStyleFunction with correct arguments', () => {
      const thunk = clearStyle(layer, vectorStyleId, groupName);
      thunk(dispatch, getState);
      expect(setStyleFunction).toHaveBeenCalledWith(
        layer,
        vectorStyleId,
        mockState.vectorStyles.custom,
        null,
        mockState,
      );
    });

    it('should dispatch CLEAR_VECTORSTYLE with correct payload', () => {
      const thunk = clearStyle(layer, vectorStyleId, groupName);
      thunk(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: CLEAR_VECTORSTYLE,
        layerId: layer.id,
        vectorStyleId,
        groupName,
        activeString: groupName,
        vectorStyles: mockVectorStylesObj,
      });
    });

    it('should dispatch with the returned vectorStyles from setStyleFunction', () => {
      const customStyles = { cleared: 'vectorStyle' };
      setStyleFunction.mockReturnValue(customStyles);
      const thunk = clearStyle(layer, vectorStyleId, groupName);
      thunk(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ vectorStyles: customStyles }),
      );
    });
  });

  describe('selectVectorFeatures', () => {
    it('should return an action object with SET_SELECTED_VECTORS type', () => {
      const payload = { 'layer-1': ['feature-1', 'feature-2'] };
      const action = selectVectorFeatures(payload);
      expect(action).toEqual({
        type: SET_SELECTED_VECTORS,
        payload,
      });
    });

    it('should include the payload in the action', () => {
      const payload = { 'layer-2': ['feature-3'] };
      const action = selectVectorFeatures(payload);
      expect(action.payload).toBe(payload);
    });

    it('should handle an empty payload object', () => {
      const payload = {};
      const action = selectVectorFeatures(payload);
      expect(action).toEqual({
        type: SET_SELECTED_VECTORS,
        payload: {},
      });
    });

    it('should handle a payload with multiple layer ids', () => {
      const payload = {
        'layer-1': ['feature-1'],
        'layer-2': ['feature-2', 'feature-3'],
      };
      const action = selectVectorFeatures(payload);
      expect(action.payload).toEqual(payload);
    });
  });
});
