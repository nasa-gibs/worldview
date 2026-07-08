import {
  getIsBetween,
  getDaysInYear,
  getISODateFormatted,
  getDisplayDate,
  removeBackMultipleInPlace,
  removeFrontMultipleInPlace,
} from './date-util';
import { formatDisplayDate } from '../../modules/date/util';

jest.mock('../../modules/date/util', () => ({
  formatDisplayDate: jest.fn((date, isSubdaily) => `MOCK_${isSubdaily ? 'subdaily' : 'default'}`),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getIsBetween', () => {
  const front = '2020-01-01T00:00:00Z';
  const back = '2020-12-31T00:00:00Z';

  it('returns true when date is strictly between front and back', () => {
    expect(getIsBetween('2020-06-01T00:00:00Z', front, back)).toBe(true);
  });

  it('returns true when date equals frontDate (inclusive lower bound)', () => {
    expect(getIsBetween(front, front, back)).toBe(true);
  });

  it('returns true when date equals backDate (inclusive upper bound)', () => {
    expect(getIsBetween(back, front, back)).toBe(true);
  });

  it('returns false when date is before frontDate', () => {
    expect(getIsBetween('2019-12-31T00:00:00Z', front, back)).toBe(false);
  });

  it('returns false when date is after backDate', () => {
    expect(getIsBetween('2021-01-01T00:00:00Z', front, back)).toBe(false);
  });
});

describe('getDaysInYear', () => {
  it('returns 1 for January 1', () => {
    expect(getDaysInYear('2020-01-01T00:00:00Z')).toBe(1);
  });

  it('returns 2 for January 2', () => {
    expect(getDaysInYear('2020-01-02T00:00:00Z')).toBe(2);
  });

  it('returns 366 for December 31 in a leap year (2020)', () => {
    expect(getDaysInYear('2020-12-31T00:00:00Z')).toBe(366);
  });

  it('returns 365 for December 31 in a non-leap year (2021)', () => {
    expect(getDaysInYear('2021-12-31T00:00:00Z')).toBe(365);
  });

  it('returns 32 for February 1', () => {
    expect(getDaysInYear('2020-02-01T00:00:00Z')).toBe(32);
  });
});

describe('getISODateFormatted', () => {
  it('strips milliseconds and appends Z', () => {
    expect(getISODateFormatted('2020-06-15T12:30:45.123Z')).toBe('2020-06-15T12:30:45Z');
  });

  it('handles midnight UTC correctly', () => {
    expect(getISODateFormatted('2020-01-01T00:00:00.000Z')).toBe('2020-01-01T00:00:00Z');
  });

  it('handles end-of-day time correctly', () => {
    expect(getISODateFormatted('2020-12-31T23:59:59.999Z')).toBe('2020-12-31T23:59:59Z');
  });
});

describe('getDisplayDate', () => {
  it('calls formatDisplayDate with a Date object and isSubdaily=false', () => {
    const result = getDisplayDate('2020-06-01T00:00:00Z', false);
    expect(formatDisplayDate).toHaveBeenCalledWith(expect.any(Date), false);
    expect(result).toBe('MOCK_default');
  });

  it('calls formatDisplayDate with isSubdaily=true', () => {
    const result = getDisplayDate('2020-06-01T12:00:00Z', true);
    expect(formatDisplayDate).toHaveBeenCalledWith(expect.any(Date), true);
    expect(result).toBe('MOCK_subdaily');
  });

  it('returns whatever formatDisplayDate returns', () => {
    formatDisplayDate.mockReturnValueOnce('custom-display');
    const result = getDisplayDate('2020-01-01T00:00:00Z', false);
    expect(result).toBe('custom-display');
  });
});

describe('removeBackMultipleInPlace', () => {
  it('pops num elements from the end of the array', () => {
    const arr = [1, 2, 3, 4, 5];
    removeBackMultipleInPlace(arr, 3);
    expect(arr).toEqual([1, 2]);
  });

  it('does nothing when num=0', () => {
    const arr = [1, 2, 3];
    removeBackMultipleInPlace(arr, 0);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('removes a single element when num=1', () => {
    const arr = ['a', 'b', 'c'];
    removeBackMultipleInPlace(arr, 1);
    expect(arr).toEqual(['a', 'b']);
  });

  it('mutates the original array reference', () => {
    const arr = [10, 20, 30];
    const ref = arr;
    removeBackMultipleInPlace(arr, 2);
    expect(ref).toBe(arr);
    expect(ref).toEqual([10]);
  });
});

describe('removeFrontMultipleInPlace', () => {
  it('shifts num elements from the front of the array', () => {
    const arr = [1, 2, 3, 4, 5];
    removeFrontMultipleInPlace(arr, 2);
    expect(arr).toEqual([3, 4, 5]);
  });

  it('does nothing when num=0', () => {
    const arr = [1, 2, 3];
    removeFrontMultipleInPlace(arr, 0);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('removes a single element when num=1', () => {
    const arr = ['a', 'b', 'c'];
    removeFrontMultipleInPlace(arr, 1);
    expect(arr).toEqual(['b', 'c']);
  });

  it('mutates the original array reference', () => {
    const arr = [10, 20, 30];
    const ref = arr;
    removeFrontMultipleInPlace(arr, 2);
    expect(ref).toBe(arr);
    expect(ref).toEqual([30]);
  });
});
