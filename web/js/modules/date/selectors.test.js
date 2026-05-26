import { getDates, getSelectedDate, getDeltaIntervalUnit } from './selectors';
import { TIME_SCALE_FROM_NUMBER } from './constants';

const selectedDate = new Date('2022-01-01');
const selectedBDate = new Date('2021-06-15');

const baseState = {
  date: {
    selected: selectedDate,
    selectedB: selectedBDate,
    interval: 3,
    delta: 1,
    customSelected: false,
    customInterval: 5,
    customDelta: 10,
  },
  compare: {
    isCompareA: true,
  },
};

describe('getDates', () => {
  test('returns the date object from state [selector-get-dates]', () => {
    const result = getDates(baseState);
    expect(result).toBe(baseState.date);
  });

  test('returns the full date object with all properties [selector-get-dates-full]', () => {
    const result = getDates(baseState);
    expect(result.selected).toEqual(selectedDate);
    expect(result.selectedB).toEqual(selectedBDate);
  });
});

describe('getSelectedDate', () => {
  test('returns date[compareDateString] when compareDateString is provided [selector-get-selected-date-string]', () => {
    const result = getSelectedDate(baseState, 'selected');
    expect(result).toEqual(selectedDate);
  });

  test('returns date[selectedB] when compareDateString is "selectedB" [selector-get-selected-date-string-b]', () => {
    const result = getSelectedDate(baseState, 'selectedB');
    expect(result).toEqual(selectedBDate);
  });

  test('returns date.selected when no compareDateString and isCompareA is true [selector-get-selected-date-compare-a]', () => {
    const result = getSelectedDate(baseState);
    expect(result).toEqual(selectedDate);
  });

  test('returns date.selectedB when no compareDateString and isCompareA is false [selector-get-selected-date-compare-b]', () => {
    const stateB = {
      ...baseState,
      compare: { isCompareA: false },
    };
    const result = getSelectedDate(stateB);
    expect(result).toEqual(selectedBDate);
  });

  test('returns undefined when compareDateString key does not exist in date [selector-get-selected-date-missing-key]', () => {
    const result = getSelectedDate(baseState, 'nonExistentKey');
    expect(result).toBeUndefined();
  });
});

describe('getDeltaIntervalUnit', () => {
  test('returns delta, interval, and unit from standard (non-custom) state [selector-get-delta-interval-unit-standard]', () => {
    const result = getDeltaIntervalUnit(baseState);
    expect(result.delta).toBe(baseState.date.delta);
    expect(result.interval).toBe(baseState.date.interval);
    expect(result.unit).toBe(TIME_SCALE_FROM_NUMBER[baseState.date.interval]);
  });

  test('returns customDelta and customInterval when customSelected is true [selector-get-delta-interval-unit-custom]', () => {
    const customState = {
      ...baseState,
      date: {
        ...baseState.date,
        customSelected: true,
      },
    };
    const result = getDeltaIntervalUnit(customState);
    expect(result.delta).toBe(customState.date.customDelta);
    expect(result.interval).toBe(customState.date.customInterval);
    expect(result.unit).toBe(TIME_SCALE_FROM_NUMBER[customState.date.customInterval]);
  });

  test('returns correct unit mapped from TIME_SCALE_FROM_NUMBER for standard interval [selector-get-delta-interval-unit-mapping]', () => {
    const result = getDeltaIntervalUnit(baseState);
    expect(result.unit).toBe(TIME_SCALE_FROM_NUMBER[3]);
  });

  test('returns correct unit mapped from TIME_SCALE_FROM_NUMBER for custom interval [selector-get-delta-interval-unit-custom-mapping]', () => {
    const customState = {
      ...baseState,
      date: {
        ...baseState.date,
        customSelected: true,
        customInterval: 5,
      },
    };
    const result = getDeltaIntervalUnit(customState);
    expect(result.unit).toBe(TIME_SCALE_FROM_NUMBER[5]);
  });

  test('returns undefined unit when interval has no mapping in TIME_SCALE_FROM_NUMBER [selector-get-delta-interval-unit-no-mapping]', () => {
    const stateWithUnknownInterval = {
      ...baseState,
      date: {
        ...baseState.date,
        interval: 999,
      },
    };
    const result = getDeltaIntervalUnit(stateWithUnknownInterval);
    expect(result.unit).toBeUndefined();
  });

  test('returned object has exactly delta, interval, and unit keys [selector-get-delta-interval-unit-shape]', () => {
    const result = getDeltaIntervalUnit(baseState);
    expect(Object.keys(result)).toEqual(['delta', 'interval', 'unit']);
  });
});
