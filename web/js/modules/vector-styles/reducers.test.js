import {
  defaultVectorStyleState,
  getInitialVectorStyleState,
  vectorStyleReducer,
} from './reducers';
import {
  CLEAR_VECTORSTYLE,
  SET_VECTORSTYLE,
  SET_FILTER_RANGE,
  SET_SELECTED_VECTORS,
} from './constants';

jest.mock('./constants', () => ({
  CLEAR_VECTORSTYLE: 'CLEAR_VECTORSTYLE',
  SET_VECTORSTYLE: 'SET_VECTORSTYLE',
  SET_FILTER_RANGE: 'SET_FILTER_RANGE',
  SET_SELECTED_VECTORS: 'SET_SELECTED_VECTORS',
}));

describe('reducers.js', () => {
  describe('defaultVectorStyleState', () => {
    it('should have a custom property defaulting to an empty object', () => {
      expect(defaultVectorStyleState.custom).toEqual({});
    });

    it('should have an active property defaulting to an empty object', () => {
      expect(defaultVectorStyleState.active).toEqual({});
    });

    it('should have an activeB property defaulting to an empty object', () => {
      expect(defaultVectorStyleState.activeB).toEqual({});
    });

    it('should have a selected property defaulting to an empty object', () => {
      expect(defaultVectorStyleState.selected).toEqual({});
    });
  });

  describe('getInitialVectorStyleState', () => {
    it('should return default state merged with custom and customDefault when config has vectorStyles', () => {
      const config = { vectorStyles: { style1: { color: 'red' } } };
      const result = getInitialVectorStyleState(config);
      expect(result.custom).toEqual({ style1: { color: 'red' } });
      expect(result.customDefault).toEqual({ style1: { color: 'red' } });
    });

    it('should return empty custom and customDefault when config has no vectorStyles', () => {
      const result = getInitialVectorStyleState({});
      expect(result.custom).toEqual({});
      expect(result.customDefault).toEqual({});
    });

    it('should return empty custom and customDefault when config is undefined', () => {
      const result = getInitialVectorStyleState(undefined);
      expect(result.custom).toEqual({});
      expect(result.customDefault).toEqual({});
    });

    it('should include default state properties in the result', () => {
      const result = getInitialVectorStyleState({});
      expect(result.active).toEqual({});
      expect(result.activeB).toEqual({});
      expect(result.selected).toEqual({});
    });

    it('should deep clone custom into customDefault so they are not the same reference', () => {
      const config = { vectorStyles: { style1: { color: 'blue' } } };
      const result = getInitialVectorStyleState(config);
      expect(result.custom).not.toBe(result.customDefault);
      expect(result.custom).toEqual(result.customDefault);
    });

    it('should use vectorStyles from config as the custom property', () => {
      const vectorStyles = { styleA: { fill: 'green' } };
      const config = { vectorStyles };
      const result = getInitialVectorStyleState(config);
      expect(result.custom).toBe(vectorStyles);
    });
  });

  describe('vectorStyleReducer', () => {
    const initialState = {
      custom: {},
      active: {},
      activeB: {},
      selected: {},
    };

    it('should return the default state when called with no arguments', () => {
      const result = vectorStyleReducer(undefined, { type: '@@INIT' });
      expect(result).toEqual(defaultVectorStyleState);
    });

    it('should return the current state for an unknown action type', () => {
      const result = vectorStyleReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(initialState);
    });

    describe('SET_FILTER_RANGE', () => {
      it('should update the active group by default when no groupName is provided', () => {
        const vectorStyles = { rangeData: true };
        const action = { type: SET_FILTER_RANGE, vectorStyles };
        const result = vectorStyleReducer(initialState, action);
        expect(result.active).toEqual(vectorStyles);
      });

      it('should update the specified groupName', () => {
        const vectorStyles = { rangeData: true };
        const action = { type: SET_FILTER_RANGE, groupName: 'activeB', vectorStyles };
        const result = vectorStyleReducer(initialState, action);
        expect(result.activeB).toEqual(vectorStyles);
      });

      it('should not mutate other state properties', () => {
        const vectorStyles = { rangeData: true };
        const action = { type: SET_FILTER_RANGE, groupName: 'active', vectorStyles };
        const result = vectorStyleReducer(initialState, action);
        expect(result.custom).toEqual(initialState.custom);
        expect(result.selected).toEqual(initialState.selected);
        expect(result.activeB).toEqual(initialState.activeB);
      });

      it('should return a new state object', () => {
        const action = { type: SET_FILTER_RANGE, vectorStyles: {} };
        const result = vectorStyleReducer(initialState, action);
        expect(result).not.toBe(initialState);
      });
    });

    describe('SET_VECTORSTYLE', () => {
      it('should update the active group by default when no groupName is provided', () => {
        const vectorStyles = { styleId: 'style-1' };
        const action = { type: SET_VECTORSTYLE, vectorStyles };
        const result = vectorStyleReducer(initialState, action);
        expect(result.active).toEqual(vectorStyles);
      });

      it('should update the specified groupName', () => {
        const vectorStyles = { styleId: 'style-2' };
        const action = { type: SET_VECTORSTYLE, groupName: 'activeB', vectorStyles };
        const result = vectorStyleReducer(initialState, action);
        expect(result.activeB).toEqual(vectorStyles);
      });

      it('should not mutate other state properties', () => {
        const vectorStyles = { styleId: 'style-1' };
        const action = { type: SET_VECTORSTYLE, groupName: 'active', vectorStyles };
        const result = vectorStyleReducer(initialState, action);
        expect(result.custom).toEqual(initialState.custom);
        expect(result.selected).toEqual(initialState.selected);
        expect(result.activeB).toEqual(initialState.activeB);
      });

      it('should return a new state object', () => {
        const action = { type: SET_VECTORSTYLE, vectorStyles: {} };
        const result = vectorStyleReducer(initialState, action);
        expect(result).not.toBe(initialState);
      });
    });

    describe('CLEAR_VECTORSTYLE', () => {
      const populatedState = {
        ...initialState,
        active: { styleId: 'style-1' },
      };

      it('should set the active group to the provided vectorStyles', () => {
        const vectorStyles = { styleId: 'cleared-style' };
        const action = { type: CLEAR_VECTORSTYLE, vectorStyles };
        const result = vectorStyleReducer(populatedState, action);
        expect(result.active).toEqual(vectorStyles);
      });

      it('should fall back to an empty object when vectorStyles is undefined', () => {
        const action = { type: CLEAR_VECTORSTYLE, groupName: 'active' };
        const result = vectorStyleReducer(populatedState, action);
        expect(result.active).toEqual({});
      });

      it('should fall back to an empty object when vectorStyles is null', () => {
        const action = { type: CLEAR_VECTORSTYLE, groupName: 'active', vectorStyles: null };
        const result = vectorStyleReducer(populatedState, action);
        expect(result.active).toEqual({});
      });

      it('should update the specified groupName', () => {
        const vectorStyles = { styleId: 'style-B' };
        const action = { type: CLEAR_VECTORSTYLE, groupName: 'activeB', vectorStyles };
        const result = vectorStyleReducer(populatedState, action);
        expect(result.activeB).toEqual(vectorStyles);
      });

      it('should not mutate other state properties', () => {
        const action = { type: CLEAR_VECTORSTYLE, groupName: 'active', vectorStyles: {} };
        const result = vectorStyleReducer(populatedState, action);
        expect(result.custom).toEqual(populatedState.custom);
        expect(result.selected).toEqual(populatedState.selected);
        expect(result.activeB).toEqual(populatedState.activeB);
      });

      it('should return a new state object', () => {
        const action = { type: CLEAR_VECTORSTYLE, vectorStyles: {} };
        const result = vectorStyleReducer(initialState, action);
        expect(result).not.toBe(initialState);
      });
    });

    describe('SET_SELECTED_VECTORS', () => {
      it('should update the selected property with the action payload', () => {
        const payload = { 'layer-1': ['feature-1', 'feature-2'] };
        const action = { type: SET_SELECTED_VECTORS, payload };
        const result = vectorStyleReducer(initialState, action);
        expect(result.selected).toEqual(payload);
      });

      it('should handle an empty payload', () => {
        const action = { type: SET_SELECTED_VECTORS, payload: {} };
        const result = vectorStyleReducer(initialState, action);
        expect(result.selected).toEqual({});
      });

      it('should handle a payload with multiple layers', () => {
        const payload = {
          'layer-1': ['feature-1'],
          'layer-2': ['feature-2', 'feature-3'],
        };
        const action = { type: SET_SELECTED_VECTORS, payload };
        const result = vectorStyleReducer(initialState, action);
        expect(result.selected).toEqual(payload);
      });

      it('should not be affected by groupName in the action', () => {
        const payload = { 'layer-1': ['feature-1'] };
        const action = { type: SET_SELECTED_VECTORS, groupName: 'activeB', payload };
        const result = vectorStyleReducer(initialState, action);
        expect(result.selected).toEqual(payload);
        expect(result.activeB).toEqual(initialState.activeB);
      });

      it('should not mutate other state properties', () => {
        const payload = { 'layer-1': ['feature-1'] };
        const action = { type: SET_SELECTED_VECTORS, payload };
        const result = vectorStyleReducer(initialState, action);
        expect(result.custom).toEqual(initialState.custom);
        expect(result.active).toEqual(initialState.active);
        expect(result.activeB).toEqual(initialState.activeB);
      });

      it('should return a new state object', () => {
        const action = { type: SET_SELECTED_VECTORS, payload: {} };
        const result = vectorStyleReducer(initialState, action);
        expect(result).not.toBe(initialState);
      });
    });
  });
});
