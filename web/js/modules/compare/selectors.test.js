import { getCompareDates } from './selectors';

const selectedDate = new Date(Date.UTC(2022, 0, 15));
const selectedBDate = new Date(Date.UTC(2021, 5, 20));

const baseState = {
  date: {
    selected: selectedDate,
    selectedB: selectedBDate,
  },
};

describe('getCompareDates', () => {
  test('returns an object with dateA and dateB keys [compare-selector-keys]', () => {
    const result = getCompareDates(baseState);
    expect(result).toHaveProperty('dateA');
    expect(result).toHaveProperty('dateB');
  });

  test('returns string values for dateA and dateB [compare-selector-string-values]', () => {
    const result = getCompareDates(baseState);
    expect(typeof result.dateA).toBe('string');
    expect(typeof result.dateB).toBe('string');
  });

  test('dateA reflects the selected date [compare-selector-date-a]', () => {
    const result = getCompareDates(baseState);
    expect(result.dateA).toBe('2022 JAN 15');
  });

  test('dateB reflects the selectedB date [compare-selector-date-b]', () => {
    const result = getCompareDates(baseState);
    expect(result.dateB).toBe('2021 JUN 20');
  });

  test('returns updated dateA when selected changes [compare-selector-date-a-updated]', () => {
    const newState = {
      date: {
        selected: new Date(Date.UTC(2020, 2, 10)),
        selectedB: selectedBDate,
      },
    };
    const result = getCompareDates(newState);
    expect(result.dateA).toBe('2020 MAR 10');
  });

  test('returns updated dateB when selectedB changes [compare-selector-date-b-updated]', () => {
    const newState = {
      date: {
        selected: selectedDate,
        selectedB: new Date(Date.UTC(2019, 11, 25)),
      },
    };
    const result = getCompareDates(newState);
    expect(result.dateB).toBe('2019 DEC 25');
  });

  test('memoizes result when state has not changed [compare-selector-memoized]', () => {
    const result1 = getCompareDates(baseState);
    const result2 = getCompareDates(baseState);
    expect(result1).toBe(result2);
  });

  test('returns new result when state changes [compare-selector-not-memoized-on-change]', () => {
    const result1 = getCompareDates(baseState);
    const changedState = {
      date: {
        selected: new Date(Date.UTC(2023, 6, 4)),
        selectedB: selectedBDate,
      },
    };
    const result2 = getCompareDates(changedState);
    expect(result1).not.toBe(result2);
    expect(result2.dateA).toBe('2023 JUL 04');
  });

  test('handles same date for both selected and selectedB [compare-selector-same-dates]', () => {
    const sameDate = new Date(Date.UTC(2022, 3, 1));
    const sameState = {
      date: {
        selected: sameDate,
        selectedB: sameDate,
      },
    };
    const result = getCompareDates(sameState);
    expect(result.dateA).toBe(result.dateB);
  });

  test('result contains only dateA and dateB keys [compare-selector-shape]', () => {
    const result = getCompareDates(baseState);
    expect(Object.keys(result)).toEqual(['dateA', 'dateB']);
  });
});
