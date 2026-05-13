import { initialState, getInitialState, screenSizeReducer } from './reducer';
import { SET_SCREEN_INFO } from './constants';

describe('initialState', () => {
  it('has the correct default shape', () => {
    expect(initialState).toEqual({
      screenHeight: '',
      screenWidth: '',
      isMobileDevice: false,
      orientation: '',
      breakpoints: {},
      isMobilePhone: false,
      isMobileTablet: false,
    });
  });
});

describe('getInitialState', () => {
  const breakpoints = {
    extraSmall: 480,
    small: 768,
    medium: 992,
    large: 1200,
  };
  it('returns full state shape when window is defined', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = getInitialState();
    expect(result).toEqual({
      breakpoints,
      screenHeight: 768,
      screenWidth: 1024,
      isMobileDevice: false,
      orientation: 'landscape',
      isMobilePhone: false,
      isMobileTablet: false,
    });
  });

  it('sets isMobileDevice to true when screenWidth < 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });

    const result = getInitialState();
    expect(result.isMobileDevice).toBe(true);
  });

  it('sets isMobileDevice to false when screenWidth >= 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 });

    const result = getInitialState();
    expect(result.isMobileDevice).toBe(false);
  });

  it('sets orientation to portrait when screenHeight > screenWidth', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });

    const result = getInitialState();
    expect(result.orientation).toBe('portrait');
  });

  it('sets orientation to landscape when screenWidth >= screenHeight', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = getInitialState();
    expect(result.orientation).toBe('landscape');
  });

  it('sets orientation to landscape when screenWidth equals screenHeight', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = getInitialState();
    expect(result.orientation).toBe('landscape');
  });

  it('always sets isMobilePhone to false', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });

    const result = getInitialState();
    expect(result.isMobilePhone).toBe(false);
  });

  it('always sets isMobileTablet to false', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });

    const result = getInitialState();
    expect(result.isMobileTablet).toBe(false);
  });

  it('returns the correct breakpoints', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = getInitialState();
    expect(result.breakpoints).toEqual(breakpoints);
  });
});

describe('screenSizeReducer', () => {
  it('returns the initialState when no state is provided and action is unknown', () => {
    const result = screenSizeReducer(undefined, { type: '@@INIT' });
    expect(result).toEqual(initialState);
  });

  it('returns the existing state for an unknown action type', () => {
    const state = { ...initialState, screenWidth: 1024 };
    const result = screenSizeReducer(state, { type: 'UNKNOWN_ACTION' });
    expect(result).toBe(state);
  });

  it('handles SET_SCREEN_INFO and returns updated state', () => {
    const action = {
      type: SET_SCREEN_INFO,
      screenHeight: 768,
      screenWidth: 1024,
      isMobileDevice: false,
      orientation: 'landscape',
      isMobilePhone: false,
      isMobileTablet: false,
    };

    const result = screenSizeReducer(initialState, action);
    expect(result).toEqual({
      ...initialState,
      screenHeight: 768,
      screenWidth: 1024,
      isMobileDevice: false,
      orientation: 'landscape',
      isMobilePhone: false,
      isMobileTablet: false,
    });
  });

  it('updates isMobileDevice to true on SET_SCREEN_INFO', () => {
    const action = {
      type: SET_SCREEN_INFO,
      screenHeight: 667,
      screenWidth: 375,
      isMobileDevice: true,
      orientation: 'portrait',
      isMobilePhone: true,
      isMobileTablet: false,
    };

    const result = screenSizeReducer(initialState, action);
    expect(result.isMobileDevice).toBe(true);
  });

  it('updates orientation to portrait on SET_SCREEN_INFO', () => {
    const action = {
      type: SET_SCREEN_INFO,
      screenHeight: 667,
      screenWidth: 375,
      isMobileDevice: true,
      orientation: 'portrait',
      isMobilePhone: true,
      isMobileTablet: false,
    };

    const result = screenSizeReducer(initialState, action);
    expect(result.orientation).toBe('portrait');
  });

  it('updates isMobilePhone on SET_SCREEN_INFO', () => {
    const action = {
      type: SET_SCREEN_INFO,
      screenHeight: 667,
      screenWidth: 375,
      isMobileDevice: true,
      orientation: 'portrait',
      isMobilePhone: true,
      isMobileTablet: false,
    };

    const result = screenSizeReducer(initialState, action);
    expect(result.isMobilePhone).toBe(true);
  });

  it('updates isMobileTablet on SET_SCREEN_INFO', () => {
    const action = {
      type: SET_SCREEN_INFO,
      screenHeight: 768,
      screenWidth: 1024,
      isMobileDevice: true,
      orientation: 'landscape',
      isMobilePhone: false,
      isMobileTablet: true,
    };

    const result = screenSizeReducer(initialState, action);
    expect(result.isMobileTablet).toBe(true);
  });

  it('preserves existing state keys not touched by SET_SCREEN_INFO', () => {
    const stateWithBreakpoints = { ...initialState, breakpoints: { small: 768 } };
    const action = {
      type: SET_SCREEN_INFO,
      screenHeight: 768,
      screenWidth: 1024,
      isMobileDevice: false,
      orientation: 'landscape',
      isMobilePhone: false,
      isMobileTablet: false,
    };

    const result = screenSizeReducer(stateWithBreakpoints, action);
    expect(result.breakpoints).toEqual({ small: 768 });
  });

  it('does not mutate the original state on SET_SCREEN_INFO', () => {
    const state = { ...initialState };
    const action = {
      type: SET_SCREEN_INFO,
      screenHeight: 768,
      screenWidth: 1024,
      isMobileDevice: false,
      orientation: 'landscape',
      isMobilePhone: false,
      isMobileTablet: false,
    };

    screenSizeReducer(state, action);
    expect(state).toEqual(initialState);
  });
});
