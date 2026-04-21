import {
  mapLocationToDateState, tryCatchDate, rollDate, roll, getDaysInMonth,
} from './util';
import fixtures from '../../fixtures';

const state = fixtures.getState();

test('parses date 1.1 [date-parse-1.1]', () => {
  const d = new Date(Date.UTC(2013, 0, 5));
  const param = {
    time: '2013-01-05',
  };
  let stateFromLocation = {
    date: {},
  };

  stateFromLocation = mapLocationToDateState(param, stateFromLocation, state);
  expect(stateFromLocation.date.selected).toMatchObject(d);
});
test('parses valid date: 1.2 [date-parse-1.2]', () => {
  const d = new Date(Date.UTC(2013, 0, 5));
  const param = {
    t: '2013-01-05',
  };
  const date = tryCatchDate(param.t, state.date.appNow);
  expect(date).toEqual(d);
});
test('If date is invalid, uses Initial Time [date-invalid]', () => {
  const param = {
    time: 'X',
  };
  let stateFromLocation = {
    date: state.date,
  };
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

  tests.forEach((t) => {
    test(t.name, () => {
      const result = rollDate(t.d, t.period.unit, t.period.value, t.minDate, t.maxDate);
      expect(result).toEqual(t.answer);
    });
  });
});

describe('roll', () => {
  const tests = [
    {
      v: 15, min: 10, max: 20, answer: 15, name: 'middle',
    },
    {
      v: 8, min: 10, max: 20, answer: 19, name: 'min',
    },
    {
      v: 22, min: 10, max: 20, answer: 11, name: 'max',
    },
  ];

  tests.forEach((t) => {
    test(t.name, () => {
      expect(roll(t.v, t.min, t.max)).toBe(t.answer);
    });
  });
});

describe('daysInMonth', () => {
  test('feb, non-leap [date-non-leap]', () => {
    const d = new Date(Date.UTC(2015, 1, 15));
    expect(getDaysInMonth(d)).toBe(28);
  });

  test('feb, leap [date-leap]', () => {
    const d = new Date(Date.UTC(2016, 1, 15));
    expect(getDaysInMonth(d)).toBe(29);
  });
});

