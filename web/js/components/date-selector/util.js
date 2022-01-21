import util from '../../util/util';

export const monthStringArray = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
export const yearValidation = (value, dateParam, validate) => {
  const date = new Date(dateParam);
  if (value > 1000 && value < 9999) {
    const newDate = new Date(date.setUTCFullYear(value));
    return validate(newDate);
  }
  return null;
};

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
export const monthValidation = (value, dateParam, validate) => {
  const date = new Date(dateParam);
  let newDate;
  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(value) && value < 13 && value > 0) {
    newDate = new Date(date.setUTCMonth(value - 1));
    if (newDate) {
      return validate(newDate);
    }
    return null;
  }
  const realMonth = util.stringInArray(monthStringArray, value);
  if (realMonth !== false) {
    const day = date.getUTCDate();
    const zeroDay = new Date(date.setUTCDate(1));

    const zeroAddMonth = new Date(zeroDay.setUTCMonth(realMonth));
    const zeroAddedMonthNumber = zeroAddMonth.getUTCMonth();

    const addDay = new Date(zeroAddMonth.setUTCDate(day));
    const addedDayMonthNumber = addDay.getUTCMonth();

    if (addedDayMonthNumber !== zeroAddedMonthNumber) {
      return false;
    }
    return validate(addDay);
  }
  return null;
};

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
export const dayValidation = (value, dateParam, validate) => {
  const date = new Date(dateParam);
  const standardMaxDateForMonth = 31;

  if (value > 0 && value <= standardMaxDateForMonth) {
    const actualMaxDateForMonth = new Date(
      date.getYear(),
      date.getMonth() + 1,
      0,
    ).getDate();

    if (value > actualMaxDateForMonth) {
      return false;
    }
    const newDate = new Date(date.setUTCDate(value));
    return validate(newDate);
  }
  return null;
};

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
export const hourValidation = (value, dateParam, validate) => {
  const date = new Date(dateParam);
  if (value >= 0 && value <= 23) {
    const newDate = new Date(date.setUTCHours(value));
    return validate(newDate);
  }
  return null;
};

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
export const minuteValidation = (value, dateParam, validate) => {
  const date = new Date(dateParam);
  if (value >= 0 && value <= 59) {
    const newDate = new Date(date.setUTCMinutes(value));
    return validate(newDate);
  }
  return null;
};
