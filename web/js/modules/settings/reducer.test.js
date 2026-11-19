import {
  initialState,
  getInitialState,
  settingsReducer,
} from './reducer';
import safeLocalStorage from '../../util/local-storage';

jest.mock('../../util/local-storage', () => ({
  keys: {
    GLOBAL_TEMPERATURE_UNIT: 'GLOBAL_TEMPERATURE_UNIT',
    ALWAYS_SHOW_DATELINES: 'ALWAYS_SHOW_DATELINES',
    COORDINATE_FORMAT: 'COORDINATE_FORMAT',
  },
  getItem: jest.fn(),
}));

jest.mock('./constants', () => ({
  CHANGE_TEMPERATURE_UNIT: 'CHANGE_TEMPERATURE_UNIT',
  CHANGE_DATELINE_VISIBILITY: 'CHANGE_DATELINE_VISIBILITY',
  CHANGE_COORDINATE_FORMAT: 'CHANGE_COORDINATE_FORMAT',
}));

import {
  CHANGE_TEMPERATURE_UNIT,
  CHANGE_DATELINE_VISIBILITY,
  CHANGE_COORDINATE_FORMAT,
} from './constants';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('initialState', () => {
  test('has correct default globalTemperatureUnit', () => {
    expect(initialState.globalTemperatureUnit).toBe('');
  });

  test('has correct default alwaysShowDatelines', () => {
    expect(initialState.alwaysShowDatelines).toBe(false);
  });

  test('has correct default coordinateFormat', () => {
    expect(initialState.coordinateFormat).toBe('');
  });
});

describe('getInitialState', () => {
  test('returns default coordinateFormat when COORDINATE_FORMAT is null in storage', () => {
    safeLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'COORDINATE_FORMAT') return null;
      if (key === 'GLOBAL_TEMPERATURE_UNIT') return 'celsius';
      if (key === 'ALWAYS_SHOW_DATELINES') return null;
      return null;
    });

    const result = getInitialState();
    expect(result.coordinateFormat).toBe('latlon-dd');
  });

  test('returns stored coordinateFormat when COORDINATE_FORMAT is not null', () => {
    safeLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'COORDINATE_FORMAT') return 'DMS';
      if (key === 'GLOBAL_TEMPERATURE_UNIT') return 'celsius';
      if (key === 'ALWAYS_SHOW_DATELINES') return null;
      return null;
    });

    const result = getInitialState();
    expect(result.coordinateFormat).toBe('DMS');
  });

  test('returns stored globalTemperatureUnit when COORDINATE_FORMAT is null', () => {
    safeLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'COORDINATE_FORMAT') return null;
      if (key === 'GLOBAL_TEMPERATURE_UNIT') return 'fahrenheit';
      if (key === 'ALWAYS_SHOW_DATELINES') return null;
      return null;
    });

    const result = getInitialState();
    expect(result.globalTemperatureUnit).toBe('fahrenheit');
  });

  test('returns stored globalTemperatureUnit when COORDINATE_FORMAT is not null', () => {
    safeLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'COORDINATE_FORMAT') return 'DD';
      if (key === 'GLOBAL_TEMPERATURE_UNIT') return 'fahrenheit';
      if (key === 'ALWAYS_SHOW_DATELINES') return null;
      return null;
    });

    const result = getInitialState();
    expect(result.globalTemperatureUnit).toBe('fahrenheit');
  });

  test('returns alwaysShowDatelines as true when ALWAYS_SHOW_DATELINES is truthy in storage', () => {
    safeLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'COORDINATE_FORMAT') return null;
      if (key === 'GLOBAL_TEMPERATURE_UNIT') return null;
      if (key === 'ALWAYS_SHOW_DATELINES') return 'true';
      return null;
    });

    const result = getInitialState();
    expect(result.alwaysShowDatelines).toBe(true);
  });

  test('returns alwaysShowDatelines as false when ALWAYS_SHOW_DATELINES is null in storage', () => {
    safeLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'COORDINATE_FORMAT') return null;
      if (key === 'GLOBAL_TEMPERATURE_UNIT') return null;
      if (key === 'ALWAYS_SHOW_DATELINES') return null;
      return null;
    });

    const result = getInitialState();
    expect(result.alwaysShowDatelines).toBe(false);
  });
});

describe('settingsReducer', () => {
  test('returns initialState when no state is provided and action is unknown', () => {
    const result = settingsReducer(undefined, { type: 'UNKNOWN' });
    expect(result).toEqual(initialState);
  });

  test('returns current state for unknown action type', () => {
    const currentState = { globalTemperatureUnit: 'celsius', alwaysShowDatelines: true, coordinateFormat: 'DD' };
    const result = settingsReducer(currentState, { type: 'UNKNOWN' });
    expect(result).toEqual(currentState);
  });

  test('handles CHANGE_TEMPERATURE_UNIT and updates globalTemperatureUnit', () => {
    const result = settingsReducer(initialState, { type: CHANGE_TEMPERATURE_UNIT, value: 'celsius' });
    expect(result.globalTemperatureUnit).toBe('celsius');
  });

  test('CHANGE_TEMPERATURE_UNIT does not mutate other state fields', () => {
    const currentState = { globalTemperatureUnit: '', alwaysShowDatelines: true, coordinateFormat: 'DMS' };
    const result = settingsReducer(currentState, { type: CHANGE_TEMPERATURE_UNIT, value: 'fahrenheit' });
    expect(result.alwaysShowDatelines).toBe(true);
    expect(result.coordinateFormat).toBe('DMS');
  });

  test('handles CHANGE_DATELINE_VISIBILITY and updates alwaysShowDatelines', () => {
    const result = settingsReducer(initialState, { type: CHANGE_DATELINE_VISIBILITY, value: true });
    expect(result.alwaysShowDatelines).toBe(true);
  });

  test('CHANGE_DATELINE_VISIBILITY does not mutate other state fields', () => {
    const currentState = { globalTemperatureUnit: 'celsius', alwaysShowDatelines: false, coordinateFormat: 'DD' };
    const result = settingsReducer(currentState, { type: CHANGE_DATELINE_VISIBILITY, value: true });
    expect(result.globalTemperatureUnit).toBe('celsius');
    expect(result.coordinateFormat).toBe('DD');
  });

  test('handles CHANGE_COORDINATE_FORMAT and updates coordinateFormat', () => {
    const result = settingsReducer(initialState, { type: CHANGE_COORDINATE_FORMAT, value: 'DDM' });
    expect(result.coordinateFormat).toBe('DDM');
  });

  test('CHANGE_COORDINATE_FORMAT does not mutate other state fields', () => {
    const currentState = { globalTemperatureUnit: 'celsius', alwaysShowDatelines: true, coordinateFormat: '' };
    const result = settingsReducer(currentState, { type: CHANGE_COORDINATE_FORMAT, value: 'DMS' });
    expect(result.globalTemperatureUnit).toBe('celsius');
    expect(result.alwaysShowDatelines).toBe(true);
  });

  test('reducer returns a new state object and does not mutate the original', () => {
    const currentState = { globalTemperatureUnit: '', alwaysShowDatelines: false, coordinateFormat: '' };
    const result = settingsReducer(currentState, { type: CHANGE_TEMPERATURE_UNIT, value: 'celsius' });
    expect(result).not.toBe(currentState);
  });
});
