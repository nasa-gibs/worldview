import {
  changeTemperatureUnit,
  changeDatelineVisibility,
  changeCoordinateFormat,
} from './actions';
import {
  CHANGE_TEMPERATURE_UNIT,
  CHANGE_DATELINE_VISIBILITY,
  CHANGE_COORDINATE_FORMAT,
} from './constants';
import safeLocalStorage from '../../util/local-storage';
import util from '../../util/util';
import { LOCATION_SEARCH_COORDINATE_FORMAT } from '../../util/constants';

jest.mock('../../util/local-storage', () => ({
  keys: {
    GLOBAL_TEMPERATURE_UNIT: 'GLOBAL_TEMPERATURE_UNIT',
    ALWAYS_SHOW_DATELINES: 'ALWAYS_SHOW_DATELINES',
    COORDINATE_FORMAT: 'COORDINATE_FORMAT',
  },
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../util/util', () => ({
  events: {
    trigger: jest.fn(),
  },
}));

jest.mock('../../util/constants', () => ({
  LOCATION_SEARCH_COORDINATE_FORMAT: 'LOCATION_SEARCH_COORDINATE_FORMAT',
}));

const { events } = util;
const { GLOBAL_TEMPERATURE_UNIT, ALWAYS_SHOW_DATELINES, COORDINATE_FORMAT } = safeLocalStorage.keys;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('changeTemperatureUnit', () => {
  test('returns correct action type and value when value is provided', () => {
    const result = changeTemperatureUnit('celsius');
    expect(result).toEqual({ type: CHANGE_TEMPERATURE_UNIT, value: 'celsius' });
  });

  test('calls setItem when value is truthy', () => {
    changeTemperatureUnit('fahrenheit');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(GLOBAL_TEMPERATURE_UNIT, 'fahrenheit');
    expect(safeLocalStorage.removeItem).not.toHaveBeenCalled();
  });

  test('calls removeItem when value is falsy (undefined)', () => {
    changeTemperatureUnit(undefined);
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(GLOBAL_TEMPERATURE_UNIT);
    expect(safeLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('calls removeItem when value is null', () => {
    changeTemperatureUnit(null);
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(GLOBAL_TEMPERATURE_UNIT);
    expect(safeLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('calls removeItem when value is empty string', () => {
    changeTemperatureUnit('');
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(GLOBAL_TEMPERATURE_UNIT);
    expect(safeLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('returns value as undefined when no value is provided', () => {
    const result = changeTemperatureUnit(undefined);
    expect(result).toEqual({ type: CHANGE_TEMPERATURE_UNIT, value: undefined });
  });
});

describe('changeDatelineVisibility', () => {
  test('returns correct action type and value when value is provided', () => {
    const result = changeDatelineVisibility(true);
    expect(result).toEqual({ type: CHANGE_DATELINE_VISIBILITY, value: true });
  });

  test('calls setItem when value is truthy', () => {
    changeDatelineVisibility(true);
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(ALWAYS_SHOW_DATELINES, true);
    expect(safeLocalStorage.removeItem).not.toHaveBeenCalled();
  });

  test('calls removeItem when value is falsy (false)', () => {
    changeDatelineVisibility(false);
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(ALWAYS_SHOW_DATELINES);
    expect(safeLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('calls removeItem when value is null', () => {
    changeDatelineVisibility(null);
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(ALWAYS_SHOW_DATELINES);
    expect(safeLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('calls removeItem when value is undefined', () => {
    changeDatelineVisibility(undefined);
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith(ALWAYS_SHOW_DATELINES);
    expect(safeLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('returns falsy value in action when value is falsy', () => {
    const result = changeDatelineVisibility(false);
    expect(result).toEqual({ type: CHANGE_DATELINE_VISIBILITY, value: false });
  });
});

describe('changeCoordinateFormat', () => {
  test('returns correct action type and value', () => {
    const result = changeCoordinateFormat('DD');
    expect(result).toEqual({ type: CHANGE_COORDINATE_FORMAT, value: 'DD' });
  });

  test('calls setItem with correct key and value', () => {
    changeCoordinateFormat('DMS');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(COORDINATE_FORMAT, 'DMS');
  });

  test('triggers LOCATION_SEARCH_COORDINATE_FORMAT event', () => {
    changeCoordinateFormat('DDM');
    expect(events.trigger).toHaveBeenCalledWith(LOCATION_SEARCH_COORDINATE_FORMAT);
  });

  test('calls setItem before triggering event', () => {
    const callOrder = [];
    safeLocalStorage.setItem.mockImplementation(() => callOrder.push('setItem'));
    events.trigger.mockImplementation(() => callOrder.push('trigger'));

    changeCoordinateFormat('DD');
    expect(callOrder).toEqual(['setItem', 'trigger']);
  });

  test('returns correct value for different format strings', () => {
    const result = changeCoordinateFormat('DDM');
    expect(result).toEqual({ type: CHANGE_COORDINATE_FORMAT, value: 'DDM' });
  });
});
