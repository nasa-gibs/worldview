export const CHANGE_CUSTOM_INTERVAL = 'DATE/CHANGE_CUSTOM_INTERVAL';
export const CHANGE_INTERVAL = 'DATE/CHANGE_INTERVAL';
export const CHANGE_TIME_SCALE = 'DATE/CHANGE_TIME_SCALE';
export const SELECT_DATE = 'DATE/SELECT_DATE';
export const UPDATE_APP_NOW = 'DATE/UPDATE_APP_NOW';
export const TOGGLE_CUSTOM_MODAL = 'DATE/TOGGLE_CUSTOM_MODAL';
export const INIT_SECOND_DATE = 'DATE/INIT_SECOND_DATE';

export const monthMap = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
};
export const timeScaleFromNumberKey = {
  0: 'custom',
  1: 'year',
  2: 'month',
  3: 'day',
  4: 'hour',
  5: 'minute',
};
export const timeScaleToNumberKey = {
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
