import util from '../../util/util';
// eslint-disable-next-line import/prefer-default-export
export const getFormattedDates = (state) => {
  const { date } = state;
  const { selected, selectedB } = date;
  const dateA = util.toISOStringDateMonthAbbrev(selected);
  const dateB = util.toISOStringDateMonthAbbrev(selectedB);
  return { dateA, dateB };
};
