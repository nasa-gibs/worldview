export const CHANGE_CUSTOM_INTERVAL = 'DATE/CHANGE_CUSTOM_INTERVAL';
export const CHANGE_INTERVAL = 'DATE/CHANGE_INTERVAL';
export const CHANGE_TIME_SCALE = 'DATE/CHANGE_TIME_SCALE';
export const SELECT_DATE = 'DATE/SELECT_DATE';
export const UPDATE_APP_NOW = 'DATE/UPDATE_APP_NOW';
export const TOGGLE_CUSTOM_MODAL = 'DATE/TOGGLE_CUSTOM_MODAL';
export const INIT_SECOND_DATE = 'DATE/INIT_SECOND_DATE';
export const ARROW_DOWN = 'DATE/ARROW_DOWN';
export const ARROW_UP = 'DATE/ARROW_UP';
export const SET_PRELOAD = 'DATE/SET_PRELOAD';
export const CLEAR_PRELOAD = 'DATE/CLEAR_PRELOAD';

export const MONTH_STRING_ARRAY = [
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
export const TIME_SCALE_FROM_NUMBER = {
  0: 'custom',
  1: 'year',
  2: 'month',
  3: 'day',
  4: 'hour',
  5: 'minute',
};
export const TIME_SCALE_TO_NUMBER = {
  custom: 0,
  year: 1,
  month: 2,
  day: 3,
  hour: 4,
  minute: 5,
};
export const timeScaleOptions = {
  minute: {
    timeAxis: {
      scale: 'minute',
      format: 'HH:mm',
      gridWidth: 12,
      scaleMs: 60000,
    },
  },
  hour: {
    timeAxis: {
      scale: 'hour',
      format: 'MMM D',
      gridWidth: 20,
      scaleMs: 3600000,
    },
  },
  day: {
    timeAxis: {
      scale: 'day',
      format: 'MMM YYYY',
      gridWidth: 12,
      scaleMs: 86400000,
    },
  },
  month: {
    timeAxis: {
      scale: 'month',
      format: 'YYYY',
      gridWidth: 12,
      scaleMs: null,
      // scaleMs: 2678400000 - REFERENCE ONLY - 31 days
    },
  },
  year: {
    timeAxis: {
      scale: 'year',
      format: 'YYYY',
      gridWidth: 18,
      scaleMs: null,
      // scaleMs: 31536000000 - REFERENCE ONLY - 365 days
    },
  },
};
export const customModalType = {
  TIMELINE: 'timeline',
  ANIMATION: 'animation',
};
