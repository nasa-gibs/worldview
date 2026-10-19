import moment from 'moment';
import getTimeRange from './date-calc';

const START_LIMIT = '2010-01-01T00:00:00Z';
const END_LIMIT = '2030-01-01T00:00:00Z';

describe('getTimeRange', () => {
  it('builds a consecutive range of day time units', () => {
    const begin = moment.utc('2023-05-01T00:00:00Z');
    const end = moment.utc('2023-05-04T00:00:00Z');
    const range = getTimeRange(begin, end, 'day', START_LIMIT, END_LIMIT);
    expect(range.length).toBe(4);
    expect(range[0].timeScale).toBe('day');
    expect(range[0].rawDate.startsWith('2023-05-01')).toBe(true);
    // each entry carries the standard shape
    expect(range[0]).toHaveProperty('dateObject');
    expect(range[0]).toHaveProperty('dayOfWeek');
    expect(range[0]).toHaveProperty('rawNextDate');
  });

  it('uppercases the formatted date string', () => {
    const begin = moment.utc('2023-05-01T00:00:00Z');
    const end = moment.utc('2023-05-01T00:00:00Z');
    const range = getTimeRange(begin, end, 'day', START_LIMIT, END_LIMIT);
    // day format is 'MMM YYYY' -> 'MAY 2023'
    expect(range[0].date).toBe('MAY 2023');
  });

  it('marks entries within the limits as withinRange and those outside as not', () => {
    const begin = moment.utc('2009-12-30T00:00:00Z');
    const end = moment.utc('2010-01-02T00:00:00Z');
    const range = getTimeRange(begin, end, 'day', START_LIMIT, END_LIMIT);
    // first entries precede the start limit
    expect(range[0].withinRange).toBe(false);
    expect(range[range.length - 1].withinRange).toBe(true);
  });

  it('produces a single entry when begin equals end', () => {
    const date = moment.utc('2023-05-01T00:00:00Z');
    const range = getTimeRange(date.clone(), date.clone(), 'day', START_LIMIT, END_LIMIT);
    expect(range.length).toBe(1);
  });

  it('supports a monthly timescale', () => {
    const begin = moment.utc('2023-01-01T00:00:00Z');
    const end = moment.utc('2023-04-01T00:00:00Z');
    const range = getTimeRange(begin, end, 'month', START_LIMIT, END_LIMIT);
    expect(range.length).toBe(4);
    expect(range[0].timeScale).toBe('month');
  });

  it('reuses cached moment limits across calls', () => {
    const begin = moment.utc('2023-05-01T00:00:00Z');
    const end = moment.utc('2023-05-02T00:00:00Z');
    // first call populates the cache, second call exercises the cache-hit branch
    const first = getTimeRange(begin.clone(), end.clone(), 'day', START_LIMIT, END_LIMIT);
    const second = getTimeRange(begin.clone(), end.clone(), 'day', START_LIMIT, END_LIMIT);
    expect(first.length).toBe(second.length);
  });
});
