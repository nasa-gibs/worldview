import { initialState, loadingReducer } from './reducers';

jest.mock('./constants', () => ({
  LOADING_START: 'LOADING_START',
  LOADING_STOP: 'LOADING_STOP',
}));

describe('initialState', () => {
  it('has an empty msg', () => {
    expect(initialState.msg).toBe('');
  });

  it('has isLoading set to false', () => {
    expect(initialState.isLoading).toBe(false);
  });
});

describe('loadingReducer', () => {
  it('returns initial state when no state is provided', () => {
    const state = loadingReducer(undefined, {});
    expect(state).toEqual(initialState);
  });

  it('returns current state for unknown action type', () => {
    const state = loadingReducer(initialState, { type: 'UNKNOWN' });
    expect(state).toEqual(initialState);
  });

  describe('LOADING_START', () => {
    it('sets isLoading to true', () => {
      const state = loadingReducer(initialState, {
        type: 'LOADING_START',
        key: 'testKey',
        msg: 'loading...',
      });
      expect(state.isLoading).toBe(true);
    });

    it('sets msg from action', () => {
      const state = loadingReducer(initialState, {
        type: 'LOADING_START',
        key: 'testKey',
        msg: 'loading...',
      });
      expect(state.msg).toBe('loading...');
    });

    it('sets the key to true in loadingMap', () => {
      const state = loadingReducer(initialState, {
        type: 'LOADING_START',
        key: 'testKey',
        msg: 'loading...',
      });
      expect(state.loadingMap.testKey).toBe(true);
    });

    it('merges new key into existing loadingMap', () => {
      const existingState = {
        ...initialState,
        loadingMap: { existingKey: true },
      };
      const state = loadingReducer(existingState, {
        type: 'LOADING_START',
        key: 'newKey',
        msg: 'loading...',
      });
      expect(state.loadingMap).toEqual({ existingKey: true, newKey: true });
    });
  });

  describe('LOADING_STOP', () => {
    it('sets the key to false in loadingMap', () => {
      const existingState = {
        ...initialState,
        isLoading: true,
        loadingMap: { testKey: true },
      };
      const state = loadingReducer(existingState, {
        type: 'LOADING_STOP',
        key: 'testKey',
      });
      expect(state.loadingMap.testKey).toBe(false);
    });

    it('sets isLoading to false when no keys remain true', () => {
      const existingState = {
        ...initialState,
        isLoading: true,
        loadingMap: { testKey: true },
      };
      const state = loadingReducer(existingState, {
        type: 'LOADING_STOP',
        key: 'testKey',
      });
      expect(state.isLoading).toBe(false);
    });

    it('keeps isLoading true when other keys are still true', () => {
      const existingState = {
        ...initialState,
        isLoading: true,
        loadingMap: { keyOne: true, keyTwo: true },
      };
      const state = loadingReducer(existingState, {
        type: 'LOADING_STOP',
        key: 'keyOne',
      });
      expect(state.isLoading).toBe(true);
    });

    it('merges updated key into existing loadingMap', () => {
      const existingState = {
        ...initialState,
        isLoading: true,
        loadingMap: { keyOne: true, keyTwo: true },
      };
      const state = loadingReducer(existingState, {
        type: 'LOADING_STOP',
        key: 'keyOne',
      });
      expect(state.loadingMap).toEqual({ keyOne: false, keyTwo: true });
    });
  });
});
