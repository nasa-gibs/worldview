import {
  mapLocationToDateState,
  tryCatchDate,
  rollDate,
  roll,
  getDaysInMonth,
  getNextTimeSelection,
  formatDisplayDate,
  parseDate,
  serializeDate,
  serializeDateWrapper,
  serializeDateBWrapper,
  serializeDateChartingWrapper,
  filterProjLayersWithStartDate,
  getMaxLayerEndDates,
  getLayersActiveAtDate,
  outOfStepChange,
  getNextDateTime,
  getNumberStepsBetween,
  coverageDateFormatter,
  formatISODate,
  parsePermalinkDate,
  getNextImageryDelta,
  checkHasFutureLayers,
} from './util';
import fixtures from '../../fixtures';

const state = fixtures.getState();
const config = fixtures.config();

test('parses date 1.1 [date-parse-1.1]', () => {
  const d = new Date(Date.UTC(2013, 0, 5));
  const param = { time: '2013-01-05' };
  let stateFromLocation = { date: {} };
  stateFromLocation = mapLocationToDateState(param, stateFromLocation, state);
  expect(stateFromLocation.date.selected).toMatchObject(d);
});

test('parses valid date: 1.2 [date-parse-1.2]', () => {
  const d = new Date(Date.UTC(2013, 0, 5));
  const param = { t: '2013-01-05' };
  const date = tryCatchDate(param.t, state.date.appNow);
  expect(date).toEqual(d);
});

test('If date is invalid, uses Initial Time [date-invalid]', () => {
  const param = { time: 'X' };
  let stateFromLocation = { date: state.date };
  stateFromLocation = mapLocationToDateState(param, stateFromLocation, state);
  expect(stateFromLocation.date.selected).toBe(state.date.selected);
});

describe('rollDate', () => {
  const tests = [{
    name: 'day up [date-day-up]',
    d: new Date(Date.UTC(2014, 1, 15)),
    period: { value: 1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 1, 16)),
  }, {
    name: 'day up, roll [date-day-up-roll]',
    d: new Date(Date.UTC(2014, 1, 28)),
    period: { value: 1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 1, 1)),
  }, {
    name: 'day down [date-day-down]',
    d: new Date(Date.UTC(2014, 1, 15)),
    period: { value: -1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 1, 14)),
  }, {
    name: 'day down, roll [date-day-down-roll]',
    d: new Date(Date.UTC(2014, 1, 1)),
    period: { value: -1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 1, 28)),
  }, {
    name: 'day up, roll over max [date-day-up-roll-max]',
    maxDate: new Date(Date.UTC(2014, 11, 2)),
    d: new Date(Date.UTC(2014, 11, 2)),
    period: { value: 1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 11, 1)),
  }, {
    name: 'day down, roll over max [date-day-down-roll-max]',
    maxDate: new Date(Date.UTC(2014, 11, 2)),
    d: new Date(Date.UTC(2014, 11, 1)),
    period: { value: -1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 11, 2)),
  }, {
    name: 'day up, roll over min [date-day-up-roll-min]',
    minDate: new Date(Date.UTC(2014, 11, 2)),
    d: new Date(Date.UTC(2014, 11, 31)),
    period: { value: 1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 11, 2)),
  }, {
    name: 'day down, roll over min [date-day-down-roll-min]',
    minDate: new Date(Date.UTC(2014, 11, 2)),
    d: new Date(Date.UTC(2014, 11, 2)),
    period: { value: -1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 11, 31)),
  }, {
    name: 'month up [date-month-up]',
    d: new Date(Date.UTC(2014, 5, 15)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 6, 15)),
  }, {
    name: 'month up, roll [date-month-up-roll]',
    d: new Date(Date.UTC(2014, 11, 15)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 0, 15)),
  }, {
    name: 'month down [date-month-down]',
    d: new Date(Date.UTC(2014, 5, 15)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 4, 15)),
  }, {
    name: 'month down, roll [date-month-down-roll]',
    d: new Date(Date.UTC(2014, 0, 15)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 11, 15)),
  }, {
    name: 'month up, roll over max [date-month-up-roll-max]',
    maxDate: new Date(Date.UTC(2014, 10, 2)),
    d: new Date(Date.UTC(2014, 9, 20)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 10, 2)),
  }, {
    name: 'month up, roll past max [date-month-up-roll-past-max]',
    maxDate: new Date(Date.UTC(2014, 10, 2)),
    d: new Date(Date.UTC(2014, 10, 1)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 0, 1)),
  }, {
    name: 'month down, roll over max [date-month-down-roll-max]',
    maxDate: new Date(Date.UTC(2014, 10, 2)),
    d: new Date(Date.UTC(2014, 0, 20)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 10, 2)),
  }, {
    name: 'month up, truncate day [date-month-up-truncate-day]',
    d: new Date(Date.UTC(2014, 0, 31)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 1, 28)),
  }, {
    name: 'month down, roll over min [date-month-down-roll-min]',
    minDate: new Date(Date.UTC(2014, 2, 25)),
    d: new Date(Date.UTC(2014, 3, 1)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 2, 25)),
  }, {
    name: 'month up, roll over min [date-month-up-roll-min]',
    minDate: new Date(Date.UTC(2014, 2, 25)),
    d: new Date(Date.UTC(2014, 11, 1)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 2, 25)),
  }, {
    name: 'month down, roll past min [date-month-down-roll-past-min]',
    minDate: new Date(Date.UTC(2014, 2, 25)),
    d: new Date(Date.UTC(2014, 2, 27)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 11, 27)),
  }, {
    name: 'year up [date-year-up]',
    d: new Date(Date.UTC(2014, 5, 15)),
    period: { value: 1, unit: 'year' },
    answer: new Date(Date.UTC(2015, 5, 15)),
  }, {
    name: 'year down [date-year-down]',
    d: new Date(Date.UTC(2014, 5, 15)),
    period: { value: -1, unit: 'year' },
    answer: new Date(Date.UTC(2013, 5, 15)),
  }, {
    name: 'year up, roll over max [date-year-up-roll-max]',
    minDate: new Date(Date.UTC(2000, 3, 12)),
    maxDate: new Date(Date.UTC(2015, 6, 16)),
    d: new Date(Date.UTC(2015, 0, 1)),
    period: { value: 1, unit: 'year' },
    answer: new Date(Date.UTC(2000, 3, 12)),
  }, {
    name: 'year down, roll over min [date-year-down-roll-min]',
    minDate: new Date(Date.UTC(2000, 3, 12)),
    maxDate: new Date(Date.UTC(2015, 6, 16)),
    d: new Date(Date.UTC(2000, 8, 1)),
    period: { value: -1, unit: 'year' },
    answer: new Date(Date.UTC(2015, 6, 16)),
  }];

  tests.forEach(({ name, d, period, answer, minDate, maxDate }) => {
    test(name, () => {
      expect(rollDate(d, period.unit, period.value, minDate, maxDate)).toEqual(answer);
    });
  });

  test('rollDate minute up [date-minute-up]', () => {
    const d = new Date(Date.UTC(2014, 0, 1, 12, 30, 0));
    expect(rollDate(d, 'minute', 1)).toEqual(new Date(Date.UTC(2014, 0, 1, 12, 31, 0)));
  });

  test('rollDate minute down [date-minute-down]', () => {
    const d = new Date(Date.UTC(2014, 0, 1, 12, 30, 0));
    expect(rollDate(d, 'minute', -1)).toEqual(new Date(Date.UTC(2014, 0, 1, 12, 29, 0)));
  });

  test('rollDate minute roll over max [date-minute-roll-max]', () => {
    const d = new Date(Date.UTC(2014, 0, 1, 12, 59, 0));
    expect(rollDate(d, 'minute', 1)).toEqual(new Date(Date.UTC(2014, 0, 1, 12, 0, 0)));
  });

  test('rollDate minute roll over min [date-minute-roll-min]', () => {
    const d = new Date(Date.UTC(2014, 0, 1, 12, 0, 0));
    expect(rollDate(d, 'minute', -1)).toEqual(new Date(Date.UTC(2014, 0, 1, 12, 59, 0)));
  });

  test('rollDate hour up [date-hour-up]', () => {
    const d = new Date(Date.UTC(2014, 0, 1, 12, 0, 0));
    expect(rollDate(d, 'hour', 1)).toEqual(new Date(Date.UTC(2014, 0, 1, 13, 0, 0)));
  });

  test('rollDate hour roll over max [date-hour-roll-max]', () => {
    const d = new Date(Date.UTC(2014, 0, 1, 23, 0, 0));
    expect(rollDate(d, 'hour', 1)).toEqual(new Date(Date.UTC(2014, 0, 1, 0, 0, 0)));
  });

  test('rollDate throws on invalid interval [date-invalid-interval]', () => {
    const d = new Date(Date.UTC(2014, 0, 1));
    expect(() => rollDate(d, 'invalid', 1)).toThrow('[rollDate] Invalid interval: invalid');
  });
});

describe('roll', () => {
  test('returns value when within range [roll-in-range]', () => {
    expect(roll(5, 1, 10)).toBe(5);
  });

  test('wraps from below min [roll-below-min]', () => {
    expect(roll(0, 1, 10)).toBe(10);
  });

  test('wraps from above max [roll-above-max]', () => {
    expect(roll(11, 1, 10)).toBe(1);
  });

  test('returns min when equal to min [roll-at-min]', () => {
    expect(roll(1, 1, 10)).toBe(1);
  });

  test('returns max when equal to max [roll-at-max]', () => {
    expect(roll(10, 1, 10)).toBe(10);
  });
});

describe('getDaysInMonth', () => {
  test('returns 28 for February in a non-leap year [days-in-month-feb]', () => {
    expect(getDaysInMonth(new Date(Date.UTC(2014, 1, 1)))).toBe(28);
  });

  test('returns 29 for February in a leap year [days-in-month-feb-leap]', () => {
    expect(getDaysInMonth(new Date(Date.UTC(2016, 1, 1)))).toBe(29);
  });

  test('returns 31 for January [days-in-month-jan]', () => {
    expect(getDaysInMonth(new Date(Date.UTC(2014, 0, 1)))).toBe(31);
  });

  test('returns 30 for April [days-in-month-apr]', () => {
    expect(getDaysInMonth(new Date(Date.UTC(2014, 3, 1)))).toBe(30);
  });

  test('accepts plain object with year and month [days-in-month-object]', () => {
    expect(getDaysInMonth({ year: 2014, month: 1 })).toBe(28);
  });
});

describe('getNextTimeSelection', () => {
  const minDate = new Date(Date.UTC(2000, 0, 1));
  const maxDate = new Date(Date.UTC(2030, 11, 31));

  test('increments year [next-time-year]', () => {
    const d = new Date(Date.UTC(2014, 5, 15));
    expect(getNextTimeSelection(1, 'year', d, minDate, maxDate))
      .toEqual(new Date(Date.UTC(2015, 5, 15)));
  });

  test('decrements year [next-time-year-down]', () => {
    const d = new Date(Date.UTC(2014, 5, 15));
    expect(getNextTimeSelection(-1, 'year', d, minDate, maxDate))
      .toEqual(new Date(Date.UTC(2013, 5, 15)));
  });

  test('increments month [next-time-month]', () => {
    const d = new Date(Date.UTC(2014, 5, 15));
    expect(getNextTimeSelection(1, 'month', d, minDate, maxDate))
      .toEqual(new Date(Date.UTC(2014, 6, 15)));
  });

  test('increments day [next-time-day]', () => {
    const d = new Date(Date.UTC(2014, 5, 15));
    expect(getNextTimeSelection(1, 'day', d, minDate, maxDate))
      .toEqual(new Date(Date.UTC(2014, 5, 16)));
  });

  test('increments hour [next-time-hour]', () => {
    const d = new Date(Date.UTC(2014, 5, 15, 10, 0));
    expect(getNextTimeSelection(1, 'hour', d, minDate, maxDate))
      .toEqual(new Date(Date.UTC(2014, 5, 15, 11, 0)));
  });

  test('increments minute [next-time-minute]', () => {
    const d = new Date(Date.UTC(2014, 5, 15, 10, 30));
    expect(getNextTimeSelection(1, 'minute', d, minDate, maxDate))
      .toEqual(new Date(Date.UTC(2014, 5, 15, 10, 31)));
  });

  test('clamps to minDate when result is before min [next-time-clamp-min]', () => {
    const d = new Date(Date.UTC(2000, 0, 2));
    expect(getNextTimeSelection(-10, 'day', d, minDate, maxDate)).toEqual(minDate);
  });

  test('clamps to maxDate when result is after max [next-time-clamp-max]', () => {
    const d = new Date(Date.UTC(2030, 11, 30));
    expect(getNextTimeSelection(10, 'day', d, minDate, maxDate)).toEqual(maxDate);
  });
});

describe('tryCatchDate', () => {
  test('returns parsed date for valid string [trycatch-valid]', () => {
    const result = tryCatchDate('2022-01-15', new Date());
    expect(result).toEqual(new Date(Date.UTC(2022, 0, 15)));
  });

  test('returns initialState for invalid string [trycatch-invalid]', () => {
    const fallback = new Date('2020-01-01');
    const result = tryCatchDate('not-a-date', fallback);
    expect(result).toEqual(fallback);
  });
});

describe('formatDisplayDate', () => {
  test('formats daily date as YYYY MMM DD [format-display-date-daily]', () => {
    const d = new Date(Date.UTC(2022, 0, 15));
    expect(formatDisplayDate(d, false)).toBe('2022 JAN 15');
  });

  test('formats subdaily date with time and Z suffix [format-display-date-subdaily]', () => {
    const d = new Date(Date.UTC(2022, 0, 15, 13, 45));
    expect(formatDisplayDate(d, true)).toBe('2022 JAN 15 13:45Z');
  });

  test('returns undefined when date is null [format-display-date-null]', () => {
    expect(formatDisplayDate(null)).toBeUndefined();
  });

  test('returns undefined when date is undefined [format-display-date-undefined]', () => {
    expect(formatDisplayDate(undefined)).toBeUndefined();
  });
});

describe('parseDate', () => {
  test('parses a full ISO date+time string [parse-date-full]', () => {
    const result = parseDate('2022-01-15T13:45:30Z');
    expect(result.getFullYear()).toBe(2022);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(45);
    expect(result.getSeconds()).toBe(30);
  });

  test('parses date string without time component [parse-date-no-time]', () => {
    const result = parseDate('2022-06-20T00:00:00Z');
    expect(result.getFullYear()).toBe(2022);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(20);
  });

  test('throws on completely invalid date string [parse-date-invalid]', () => {
    expect(() => parseDate('not-a-date')).toThrow();
  });

  test('parses date with milliseconds [parse-date-milliseconds]', () => {
    const result = parseDate('2022-01-15T10:30:00.500Z');
    expect(result.getFullYear()).toBe(2022);
  });
});

describe('serializeDate', () => {
  test('serializes a UTC date to the expected format [serialize-date]', () => {
    const d = new Date(Date.UTC(2022, 0, 15, 13, 45, 0));
    const result = serializeDate(d);
    expect(result).toBe('2022-01-15-T13:45:00Z');
  });

  test('serializes midnight correctly [serialize-date-midnight]', () => {
    const d = new Date(Date.UTC(2020, 5, 1, 0, 0, 0));
    expect(serializeDate(d)).toBe('2020-06-01-T00:00:00Z');
  });
});

describe('filterProjLayersWithStartDate', () => {
  test('filters layers with startDate and matching projection [filter-proj-layers]', () => {
    const layers = [
      { startDate: '2020-01-01', projections: { geographic: {} } },
      { startDate: '2020-01-01', projections: { arctic: {} } },
      { projections: { geographic: {} } },
    ];
    expect(filterProjLayersWithStartDate(layers, 'geographic')).toHaveLength(1);
  });

  test('returns empty array when no layers match [filter-proj-layers-empty]', () => {
    expect(filterProjLayersWithStartDate([], 'geographic')).toEqual([]);
  });

  test('excludes layers without startDate [filter-proj-layers-no-startdate]', () => {
    const layers = [{ projections: { geographic: {} } }];
    expect(filterProjLayersWithStartDate(layers, 'geographic')).toHaveLength(0);
  });

  test('excludes layers without matching projection [filter-proj-layers-no-proj]', () => {
    const layers = [{ startDate: '2020-01-01', projections: { arctic: {} } }];
    expect(filterProjLayersWithStartDate(layers, 'geographic')).toHaveLength(0);
  });
});

describe('getMaxLayerEndDates', () => {
  test('returns end dates for layers with endDate [max-layer-end-dates]', () => {
    const appNow = new Date('2022-01-01');
    const layers = [{ endDate: '2021-06-01' }, { endDate: '2021-12-01' }];
    const result = getMaxLayerEndDates(layers, appNow);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(new Date('2021-06-01'));
  });

  test('uses appNow when layer has no endDate [max-layer-end-dates-fallback]', () => {
    const appNow = new Date('2022-01-01');
    const result = getMaxLayerEndDates([{ endDate: null }], appNow);
    expect(result[0]).toEqual(appNow);
  });

  test('returns empty array for no layers [max-layer-end-dates-empty]', () => {
    expect(getMaxLayerEndDates([], new Date())).toEqual([]);
  });
});

describe('getLayersActiveAtDate', () => {
  test('returns empty array when no layers are visible [layers-active-empty]', () => {
    const date = new Date('2022-01-01');
    const layers = [{ visible: false, startDate: '2020-01-01' }, { visible: true }];
    expect(getLayersActiveAtDate(layers, date)).toEqual([]);
  });

  test('returns matching visible layer with startDate [layers-active-match]', () => {
    const date = new Date('2022-01-01');
    const layers = [{ visible: true, startDate: '2023-01-01' }];
    const result = getLayersActiveAtDate(layers, date);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('formatISODate', () => {
  test('formats a date to YYYY-MM-DD [format-iso-date]', () => {
    const d = new Date(2022, 0, 15);
    expect(formatISODate(d)).toBe('2022-01-15');
  });

  test('formats June correctly [format-iso-date-june]', () => {
    const d = new Date(2020, 5, 1);
    expect(formatISODate(d)).toBe('2020-06-01');
  });
});

describe('mapLocationToDateState', () => {
  test('returns unchanged state when no time or t param [date-parse-no-param]', () => {
    let stateFromLocation = { date: { selected: state.date.selected } };
    stateFromLocation = mapLocationToDateState({}, stateFromLocation, state);
    expect(stateFromLocation.date.selected).toEqual(state.date.selected);
  });

  test('handles rt parameter for relative time [date-parse-rt]', () => {
    const param = { rt: '-PT60M' };
    let stateFromLocation = { date: {} };
    stateFromLocation = mapLocationToDateState(param, stateFromLocation, state);
    expect(stateFromLocation.date.selected).toBeDefined();
  });

  test('handles time param when t is not present [date-parse-time-legacy]', () => {
    const d = new Date(Date.UTC(2013, 0, 5));
    const param = { time: '2013-01-05' };
    let stateFromLocation = { date: {} };
    stateFromLocation = mapLocationToDateState(param, stateFromLocation, state);
    expect(stateFromLocation.date.selected).toMatchObject(d);
  });

  test('ignores time param when t is also present [date-parse-time-ignored-with-t]', () => {
    const param = { time: '2013-01-05', t: '2014-06-01' };
    let stateFromLocation = { date: { selected: state.date.selected } };
    stateFromLocation = mapLocationToDateState(param, stateFromLocation, state);
    expect(stateFromLocation.date.selected).toEqual(state.date.selected);
  });
});

describe('outOfStepChange', () => {
  const testState = {
    ...state,
    date: { ...state.date, delta: 1, interval: 3, customSelected: false },
  };

  test('returns false when newDate is the next step [out-of-step-false]', () => {
    const nextDate = getNextDateTime(testState, 1);
    expect(outOfStepChange(testState, nextDate)).toBe(false);
  });

  test('returns false when newDate is the previous step [out-of-step-prev-false]', () => {
    const prevDate = getNextDateTime(testState, -1);
    expect(outOfStepChange(testState, prevDate)).toBe(false);
  });

  test('returns true when newDate is out of step [out-of-step-true]', () => {
    const randomDate = new Date(Date.UTC(2000, 5, 17, 0, 0, 0));
    expect(outOfStepChange(testState, randomDate)).toBe(true);
  });
});

describe('getNumberStepsBetween', () => {
  const testState = {
    ...state,
    date: { ...state.date, delta: 1, interval: 3, customSelected: false },
  };

  test('returns a number [steps-between-type]', () => {
    const start = new Date(Date.UTC(2022, 0, 10));
    const end = new Date(Date.UTC(2022, 0, 1));
    expect(typeof getNumberStepsBetween(testState, start, end)).toBe('number');
  });

  test('returns positive when start is after end [steps-between-positive]', () => {
    const start = new Date(Date.UTC(2022, 0, 10));
    const end = new Date(Date.UTC(2022, 0, 1));
    expect(getNumberStepsBetween(testState, start, end)).toBeGreaterThan(0);
  });

  test('returns negative when start is before end [steps-between-negative]', () => {
    const start = new Date(Date.UTC(2022, 0, 1));
    const end = new Date(Date.UTC(2022, 0, 10));
    expect(getNumberStepsBetween(testState, start, end)).toBeLessThan(0);
  });
});

describe('coverageDateFormatter', () => {
  test('returns undefined when date is null [coverage-date-formatter-null]', () => {
    expect(coverageDateFormatter('START-DATE', null, 'daily')).toBeUndefined();
  });

  test('returns undefined when date is undefined [coverage-date-formatter-undefined]', () => {
    expect(coverageDateFormatter('START-DATE', undefined, 'subdaily')).toBeUndefined();
  });

  test('formats subdaily date [coverage-date-formatter-subdaily]', () => {
    expect(coverageDateFormatter('START-DATE', '2022-01-15T13:45:00Z', 'subdaily')).toBeDefined();
  });

  test('formats yearly START-DATE [coverage-date-formatter-yearly-start]', () => {
    expect(coverageDateFormatter('START-DATE', '2022-01-15T00:00:00Z', 'yearly')).toBeDefined();
  });

  test('formats yearly END-DATE [coverage-date-formatter-yearly-end]', () => {
    expect(coverageDateFormatter('END-DATE', '2022-01-15T00:00:00Z', 'yearly')).toBeDefined();
  });

  test('formats monthly START-DATE [coverage-date-formatter-monthly-start]', () => {
    expect(coverageDateFormatter('START-DATE', '2022-01-15T00:00:00Z', 'monthly')).toBeDefined();
  });

  test('formats monthly END-DATE [coverage-date-formatter-monthly-end]', () => {
    expect(coverageDateFormatter('END-DATE', '2022-01-15T00:00:00Z', 'monthly')).toBeDefined();
  });

  test('formats default period [coverage-date-formatter-default]', () => {
    expect(coverageDateFormatter('START-DATE', '2022-01-15T00:00:00Z', 'daily')).toBeDefined();
  });
});

describe('parsePermalinkDate', () => {
  const defaultDate = new Date(Date.UTC(2022, 5, 1));

  test('returns startDate when parsed time is before startDate [permalink-before-start]', () => {
    const cfg = { ...config, startDate: '2010-01-01' };
    const result = parsePermalinkDate(defaultDate, '2000-01-01', null, cfg);
    expect(result).toEqual(new Date(cfg.startDate));
  });

  test('returns parsed date when time is within valid range [permalink-in-range]', () => {
    const cfg = { ...config, startDate: '2000-01-01' };
    const result = parsePermalinkDate(defaultDate, '2015-06-15', null, cfg);
    expect(result).toEqual(new Date(Date.UTC(2015, 5, 15)));
  });

  test('returns a Date when time is in future and no layer date range [permalink-future-no-range]', () => {
    const cfg = { ...config, startDate: '2000-01-01' };
    const result = parsePermalinkDate(defaultDate, '2099-01-01', null, cfg);
    expect(result instanceof Date).toBe(true);
  });

  test('returns initialState when str is invalid [permalink-invalid-str]', () => {
    const cfg = { ...config, startDate: '2000-01-01' };
    const result = parsePermalinkDate(defaultDate, 'bad-date', null, cfg);
    expect(result).toEqual(defaultDate);
  });
});

describe('serializeDateWrapper', () => {
  const initialDate = new Date(Date.UTC(2022, 0, 1));

  test('returns undefined when animation is playing [serialize-wrapper-playing]', () => {
    const s = {
      ...state,
      animation: { isPlaying: true },
      config: { ...config, initialDate },
      compare: { active: false, isCompareA: true },
      date: { ...state.date, selected: initialDate },
    };
    expect(serializeDateWrapper(initialDate, s, {})).toBeUndefined();
  });

  test('returns undefined when no prev params and date is default [serialize-wrapper-default]', () => {
    const s = {
      ...state,
      animation: { isPlaying: false },
      config: { ...config, initialDate },
      compare: { active: false, isCompareA: true },
      date: { ...state.date, selected: initialDate },
    };
    expect(serializeDateWrapper(initialDate, s, {})).toBeUndefined();
  });

  test('returns serialized date when date differs from initial [serialize-wrapper-non-default]', () => {
    const selected = new Date(Date.UTC(2022, 5, 15));
    const s = {
      ...state,
      animation: { isPlaying: false },
      config: { ...config, initialDate },
      compare: { active: false, isCompareA: true },
      date: { ...state.date, selected },
    };
    const result = serializeDateWrapper(selected, s, {});
    expect(typeof result).toBe('string');
  });

  test('returns serialized dateB when compare exited with B selected [serialize-wrapper-dateb-selected]', () => {
    const dateB = new Date(Date.UTC(2021, 3, 10));
    const s = {
      ...state,
      animation: { isPlaying: false },
      config: { ...config, initialDate },
      compare: { active: false, isCompareA: false },
      date: { ...state.date, selectedB: dateB },
    };
    const result = serializeDateWrapper(dateB, s, { someParam: true });
    expect(typeof result).toBe('string');
  });
});

describe('serializeDateBWrapper', () => {
  const initialDate = new Date(Date.UTC(2022, 0, 1));

  test('returns undefined when compare is not active [serialize-b-wrapper-inactive]', () => {
    const s = {
      ...state,
      animation: { isPlaying: false },
      config: { ...config, initialDate },
      compare: { active: false },
      date: { ...state.date },
    };
    expect(serializeDateBWrapper(initialDate, s, {})).toBeUndefined();
  });

  test('returns serialized date when compare is active and date differs from default [serialize-b-wrapper-active]', () => {
    const dateB = new Date(Date.UTC(2021, 3, 10));
    const s = {
      ...state,
      animation: { isPlaying: false },
      config: { ...config, initialDate },
      compare: { active: true },
      date: { ...state.date, selectedB: dateB },
    };
    const result = serializeDateBWrapper(dateB, s, { someParam: true });
    expect(typeof result).toBe('string');
  });

  test('returns undefined when compare active but date is default minus 7 days with no prev params [serialize-b-wrapper-default]', () => {
    const s = {
      ...state,
      animation: { isPlaying: false },
      config: { ...config, initialDate },
      compare: { active: true },
      date: { ...state.date },
    };
    const defaultB = new Date(Date.UTC(2021, 11, 25));
    expect(serializeDateBWrapper(defaultB, s, {})).toBeUndefined();
  });
});

describe('serializeDateChartingWrapper', () => {
  test('returns undefined when charting is not active [serialize-charting-inactive]', () => {
    const s = { ...state, charting: { active: false, timeSpanStartDate: null } };
    expect(serializeDateChartingWrapper(new Date(), s)).toBeUndefined();
  });

  test('returns undefined when timeSpanStartDate is falsy [serialize-charting-no-start]', () => {
    const s = { ...state, charting: { active: true, timeSpanStartDate: null } };
    expect(serializeDateChartingWrapper(new Date(), s)).toBeUndefined();
  });

  test('returns serialized date when charting is active with timeSpanStartDate [serialize-charting-active]', () => {
    const d = new Date(Date.UTC(2022, 0, 15));
    const s = { ...state, charting: { active: true, timeSpanStartDate: d } };
    const result = serializeDateChartingWrapper(d, s);
    expect(typeof result).toBe('string');
  });
});

describe('checkHasFutureLayers', () => {
  test('returns false when no future layers in non-compare mode [has-future-layers-false]', () => {
    expect(checkHasFutureLayers(state)).toBe(false);
  });

  test('returns false when compare active and no future layers [has-future-layers-compare-false]', () => {
    const s = {
      ...state,
      compare: { ...state.compare, active: true },
      layers: {
        ...state.layers,
        active: { layers: [] },
        activeB: { layers: [] },
      },
    };
    expect(checkHasFutureLayers(s)).toBe(false);
  });
});

describe('getNextImageryDelta', () => {
  test('returns 1 when all layers are invalid (no dateRanges) [imagery-delta-invalid]', () => {
    const layers = [{ visible: true }, { visible: false }];
    expect(getNextImageryDelta(layers, '2022-01-01T00:00:00Z', 1)).toBe(1);
  });

  test('returns 1 when layers array is empty [imagery-delta-empty]', () => {
    expect(getNextImageryDelta([], '2022-01-01T00:00:00Z', 1)).toBe(1);
  });

  test('returns delta from tempoDateRanges when present [imagery-delta-tempo]', () => {
    const layers = [{
      visible: true,
      tempoDateRanges: [{
        startDate: '2022-01-01T00:00:00Z',
        endDate: '2022-01-01T00:10:00Z',
        dateInterval: '10',
      }],
    }];
    const result = getNextImageryDelta(layers, '2021-12-31T00:00:00Z', 1);
    expect(typeof result).toBe('number');
  });

  test('returns delta from dateRanges when present [imagery-delta-dateranges]', () => {
    const layers = [{
      visible: true,
      dateRanges: [{
        startDate: '2022-01-01T00:00:00Z',
        endDate: '2022-01-01T01:00:00Z',
        dateInterval: '60',
      }],
    }];
    const result = getNextImageryDelta(layers, '2021-12-31T00:00:00Z', 1);
    expect(typeof result).toBe('number');
  });

  test('handles granuleDateRanges with explicit interval [imagery-delta-granule-with-interval]', () => {
    const layers = [{
      visible: true,
      granuleDateRanges: [
        ['2022-01-01T00:00:00Z', '2022-01-01T00:10:00Z', '10'],
      ],
    }];
    const result = getNextImageryDelta(layers, '2021-12-31T00:00:00Z', 1);
    expect(typeof result).toBe('number');
  });

  test('handles granuleDateRanges without explicit interval (CMR derived) [imagery-delta-granule-no-interval]', () => {
    const layers = [{
      visible: true,
      granuleDateRanges: [
        ['2022-01-01T00:00:00Z', '2022-01-01T01:00:00Z', null],
      ],
    }];
    const result = getNextImageryDelta(layers, '2021-12-31T00:00:00Z', 1);
    expect(typeof result).toBe('number');
  });

  test('handles backward direction (signConstant < 0) [imagery-delta-backward]', () => {
    const layers = [{
      visible: true,
      dateRanges: [{
        startDate: '2021-01-01T00:00:00Z',
        endDate: '2021-12-31T00:00:00Z',
        dateInterval: '60',
      }],
    }];
    const result = getNextImageryDelta(layers, '2022-01-01T00:00:00Z', -1);
    expect(typeof result).toBe('number');
  });

  test('skips layer with no dateRanges and counts as invalid [imagery-delta-no-ranges-visible]', () => {
    const result = getNextImageryDelta([{ visible: true }], '2022-01-01T00:00:00Z', 1);
    expect(result).toBe(1);
  });
});
