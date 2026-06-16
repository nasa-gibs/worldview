import {
  yearValidation,
  monthValidation,
  dayValidation,
  hourValidation,
  minuteValidation,
} from './util';

// Mock the util.stringInArray used by monthValidation
jest.mock('../../util/util', () => ({
  stringInArray: jest.fn(),
}));

import util from '../../util/util';

describe('date-selector util validations', () => {
  const baseDate = '2020-02-15T00:00:00Z'; // Feb 15, 2020 (leap year)

  test('yearValidation: valid year calls validate with new date', () => {
    const validate = jest.fn(d => d);
    const result = yearValidation(2025, baseDate, validate);
    expect(result instanceof Date).toBe(true);
    expect(result.getUTCFullYear()).toBe(2025);
    expect(validate).toHaveBeenCalledTimes(1);
  });

  test('yearValidation: invalid year returns null and does not call validate', () => {
    const validate = jest.fn();
    expect(yearValidation(999, baseDate, validate)).toBeNull();
    expect(validate).not.toHaveBeenCalled();
  });

  test('monthValidation: numeric month valid calls validate', () => {
    const validate = jest.fn(d => d);
    const res = monthValidation(3, baseDate, validate); // March
    expect(res.getUTCMonth()).toBe(2);
    expect(validate).toHaveBeenCalledTimes(1);
  });

  test('monthValidation: string month found and day preserved', () => {
    // Simulate util.stringInArray finding index for "March" -> 2
    util.stringInArray.mockReturnValue(2);
    const validate = jest.fn(d => d);
    const res = monthValidation('March', baseDate, validate);
    expect(res.getUTCMonth()).toBe(2);
    expect(res.getUTCDate()).toBe(15);
    expect(validate).toHaveBeenCalledTimes(1);
  });

  test('monthValidation: string month where day overflows returns false', () => {
    // Start from Jan 31 -> moving to Feb should overflow
    const jan31 = '2021-01-31T00:00:00Z';
    // Simulate util returning index 1 (February)
    util.stringInArray.mockReturnValue(1);
    const validate = jest.fn();
    const res = monthValidation('February', jan31, validate);
    expect(res).toBe(false);
    expect(validate).not.toHaveBeenCalled();
  });

  test('monthValidation: string month not found returns null', () => {
    util.stringInArray.mockReturnValue(false);
    const validate = jest.fn();
    expect(monthValidation('NotAMonth', baseDate, validate)).toBeNull();
    expect(validate).not.toHaveBeenCalled();
  });

  test('dayValidation: valid day within month calls validate', () => {
    const validate = jest.fn(d => d);
    const res = dayValidation(29, baseDate, validate); // Feb 2020 has 29 days
    expect(res.getUTCDate()).toBe(29);
    expect(validate).toHaveBeenCalledTimes(1);
  });

  test('dayValidation: day exceeds actual month returns false', () => {
    const validate = jest.fn();
    // Feb 2021 has 28 days
    const feb2021 = '2021-02-05T00:00:00Z';
    expect(dayValidation(29, feb2021, validate)).toBe(false);
    expect(validate).not.toHaveBeenCalled();
  });

  test('dayValidation: invalid day returns null', () => {
    const validate = jest.fn();
    expect(dayValidation(0, baseDate, validate)).toBeNull();
    expect(dayValidation(32, baseDate, validate)).toBeNull();
    expect(validate).not.toHaveBeenCalled();
  });

  test('hourValidation: valid hour calls validate', () => {
    const validate = jest.fn(d => d);
    const res = hourValidation(13, baseDate, validate);
    expect(res.getUTCHours()).toBe(13);
    expect(validate).toHaveBeenCalledTimes(1);
  });

  test('hourValidation: invalid hour returns null', () => {
    const validate = jest.fn();
    expect(hourValidation(24, baseDate, validate)).toBeNull();
    expect(validate).not.toHaveBeenCalled();
  });

  test('minuteValidation: valid minute calls validate', () => {
    const validate = jest.fn(d => d);
    const res = minuteValidation(45, baseDate, validate);
    expect(res.getUTCMinutes()).toBe(45);
    expect(validate).toHaveBeenCalledTimes(1);
  });

  test('minuteValidation: invalid minute returns null', () => {
    const validate = jest.fn();
    expect(minuteValidation(60, baseDate, validate)).toBeNull();
    expect(validate).not.toHaveBeenCalled();
  });
});
