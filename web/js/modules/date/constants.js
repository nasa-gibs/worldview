export const CHANGE_CUSTOM_INTERVAL = 'DATE/CHANGE_CUSTOM_INTERVAL';
export const CHANGE_INTERVAL = 'DATE/CHANGE_INTERVAL';
// export const CHANGE_DELTA = 'DATE/CHANGE_DELTA';
export const CHANGE_TIME_SCALE = 'DATE/CHANGE_TIME_SCALE';
export const SELECT_DATE = 'DATE/SELECT_DATE';

export const timeScaleFromNumberKey = {
  '0': 'custom',
  '1': 'year',
  '2': 'month',
  '3': 'day',
  '4': 'hour',
  '5': 'minute'
};

export const timeScaleToNumberKey = {
  custom: '0',
  year: '1',
  month: '2',
  day: '3',
  hour: '4',
  minute: '5'
};
