import util from '../../util/util';

let minDate;
let maxDate;

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

export function validateBasedOnType(type, value, date, min, max) {
  let newDate;
  minDate = min;
  maxDate = max;
  switch (type) {
    case 'year':
      newDate = yearValidation(value, date);
      break;
    case 'month':
      newDate = monthValidation(value, date);
      // transform month number to string (e.g., 3 -> 'MAR')
      // eslint-disable-next-line no-restricted-globals
      if (newDate !== null && !isNaN(value)) {
        value = monthStringArray[value - 1];
      }
      break;
    case 'day':
      newDate = dayValidation(value, date);
      break;
    case 'hour':
      newDate = hourValidation(value, date);
      break;
    case 'minute':
      newDate = minuteValidation(value, date);
      break;
    default:
      break;
  }
  // add leading '0' to single string number
  if (newDate !== null && value.length === 1) {
    value = `0${value}`;
  }
  return newDate;
}

/**
 *
 * @param {*} date
 * @returns
 */
const validateDate = (date) => date > minDate && date <= maxDate && date;

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
const yearValidation = (value, dateParam) => {
  const date = new Date(dateParam);
  if (value > 1000 && value < 9999) {
    const newDate = new Date(date.setUTCFullYear(value));
    return validateDate(newDate);
  }
  return null;
};

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
const monthValidation = (value, dateParam) => {
  const date = new Date(dateParam);
  let newDate;
  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(value) && value < 13 && value > 0) {
    newDate = new Date(date.setUTCMonth(value - 1));
    if (newDate) {
      return validateDate(newDate);
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
    return validateDate(addDay);
  }
  return null;
};

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
const dayValidation = (value, dateParam) => {
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
    return validateDate(newDate);
  }
  return null;
};

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
const hourValidation = (value, dateParam) => {
  const date = new Date(dateParam);
  if (value >= 0 && value <= 23) {
    const newDate = new Date(date.setUTCHours(value));
    return validateDate(newDate);
  }
  return null;
};

/**
 *
 * @param {*} value
 * @param {*} date
 * @returns
 */
const minuteValidation = (value, dateParam) => {
  const date = new Date(dateParam);
  if (value >= 0 && value <= 59) {
    const newDate = new Date(date.setUTCMinutes(value));
    return validateDate(newDate);
  }
  return null;
};
